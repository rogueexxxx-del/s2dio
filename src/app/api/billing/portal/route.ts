import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe, isStripeConfigured } from "@/lib/stripe";

const PortalSchema = z.object({
  customerId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = PortalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid customer identifier" }, { status: 400 });
    }

    const { customerId } = parsed.data;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (isStripeConfigured) {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${appUrl}/`,
      });

      return NextResponse.json({ url: portalSession.url });
    }

    return NextResponse.json({
      url: `${appUrl}/?billing_portal=demo`,
      message: "Demo 1-click subscription management portal",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
