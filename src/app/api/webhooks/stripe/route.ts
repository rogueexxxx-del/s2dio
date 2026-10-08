import { NextRequest, NextResponse } from "next/server";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-server";
import Stripe from "stripe";

// Memory cache for event deduplication in local testing
const processedEvents = new Set<string>();

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    if (isStripeConfigured && process.env.STRIPE_WEBHOOK_SECRET) {
      if (!signature) {
        return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
      }

      try {
        event = stripe.webhooks.constructEvent(
          rawBody,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } catch (err: any) {
        return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 });
      }
    } else {
      // In development / test mode without active signing secret
      try {
        event = JSON.parse(rawBody);
      } catch {
        return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
      }
    }

    // 1. Idempotency Check: prevent duplicate event execution on retries
    if (processedEvents.has(event.id)) {
      return NextResponse.json({ received: true, deduplicated: true });
    }

    if (isSupabaseConfigured) {
      const { data: existing } = await supabaseAdmin
        .from("stripe_webhook_events")
        .select("id")
        .eq("id", event.id)
        .single();

      if (existing) {
        return NextResponse.json({ received: true, deduplicated: true });
      }

      // Record event ID before handling
      await supabaseAdmin.from("stripe_webhook_events").insert({
        id: event.id,
        event_type: event.type,
      });
    }

    processedEvents.add(event.id);

    // 2. Handle relevant Stripe subscription events
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id || session.metadata?.userId;
        const planTier = (session.metadata?.planTier as any) || "pro_flex";
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (userId && isSupabaseConfigured) {
          // Update profile tier
          await supabaseAdmin
            .from("profiles")
            .update({ plan_tier: planTier })
            .eq("id", userId);

          // Upsert subscription record
          await supabaseAdmin.from("subscriptions").upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            plan_tier: planTier,
            status: "active",
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const status = subscription.status;
        const cancelAtPeriodEnd = subscription.cancel_at_period_end;

        if (isSupabaseConfigured) {
          await supabaseAdmin
            .from("subscriptions")
            .update({
              status,
              cancel_at_period_end: cancelAtPeriodEnd,
              current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
            })
            .eq("stripe_customer_id", customerId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        if (isSupabaseConfigured) {
          // Downgrade user to starter tier
          const { data: sub } = await supabaseAdmin
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_customer_id", customerId)
            .single();

          if (sub?.user_id) {
            await supabaseAdmin
              .from("profiles")
              .update({ plan_tier: "starter" })
              .eq("id", sub.user_id);

            await supabaseAdmin
              .from("subscriptions")
              .update({ status: "canceled" })
              .eq("stripe_customer_id", customerId);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        if (isSupabaseConfigured) {
          await supabaseAdmin
            .from("subscriptions")
            .update({ status: "past_due" })
            .eq("stripe_customer_id", customerId);
        }
        break;
      }

      default:
        // Ignore unhandled event types
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Webhook processing error" },
      { status: 500 }
    );
  }
}
