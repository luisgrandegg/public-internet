-- Generalize Payment provider columns (ADR-006 amendment: pluggable PaymentProvider).
-- Renames preserve existing data — do not drop/recreate.

-- AlterTable
ALTER TABLE "Payment" RENAME COLUMN "stripeCheckoutSessionId" TO "providerSessionId";
ALTER TABLE "Payment" RENAME COLUMN "stripePaymentIntentId" TO "providerPaymentReference";
ALTER TABLE "Payment" ADD COLUMN "providerCheckoutUrl" TEXT;
