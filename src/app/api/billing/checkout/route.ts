import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe, isStripeConfigured, PLAN_PRICES } from "@/lib/stripe";

const CheckoutSchema = z.object({
  planTier: z.enum(["starter", "pro_flex", "pro_unlimited"]),
  userId: z.string().optional().default("demo-user-id"),
  email: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CheckoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid plan selection" }, { status: 400 });
    }

    const { planTier, userId, email } = parsed.data;
    const priceId = PLAN_PRICES[planTier];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (isStripeConfigured) {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${appUrl}/session/new?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}?checkout=cancelled`,
        customer_email: email,
        client_reference_id: userId,
        metadata: {
          userId,
          planTier,
        },
      });

      return NextResponse.json({ url: session.url });
    }

    // Local / Test Mock Mode
    return NextResponse.json({
      url: `${appUrl}/session/new?mock_checkout=success&tier=${planTier}`,
      message: "Stripe test mode mock session created",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
