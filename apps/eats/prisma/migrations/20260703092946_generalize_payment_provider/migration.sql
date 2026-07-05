-- Generalize Payment columns to provider-neutral names (ADR-006 amendment).
-- RENAME (not drop/add) so existing payment rows keep their session ids,
-- payment references, and checkout URLs.
ALTER TABLE "Payment" RENAME COLUMN "stripeCheckoutSessionId" TO "providerSessionId";
ALTER TABLE "Payment" RENAME COLUMN "stripePaymentIntentId" TO "providerPaymentReference";
ALTER TABLE "Payment" RENAME COLUMN "stripeCheckoutUrl" TO "providerCheckoutUrl";
