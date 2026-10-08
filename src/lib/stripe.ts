import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder";

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-12-18.acacia" as any,
  appInfo: {
    name: "S2DIO Music Studio",
    version: "0.1.0",
  },
});

export const isStripeConfigured = Boolean(
  process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes("placeholder")
);

export const PLAN_PRICES = {
  starter: process.env.STRIPE_PRICE_STARTER || "price_starter_mock",
  pro_flex: process.env.STRIPE_PRICE_PRO_FLEX || "price_pro_flex_mock",
  pro_unlimited: process.env.STRIPE_PRICE_PRO_UNLIMITED || "price_pro_unlimited_mock",
};
