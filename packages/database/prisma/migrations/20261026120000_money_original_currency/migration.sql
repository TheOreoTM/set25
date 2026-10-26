-- Money entries paid in a foreign currency keep the original amount and the
-- rate used. "amount" remains the MVR equivalent used by every total.
ALTER TABLE "MoneyEntry"
ADD COLUMN "originalCurrency" TEXT,
ADD COLUMN "originalAmount" DECIMAL(12,2),
ADD COLUMN "exchangeRateToMvr" DECIMAL(18,6);

ALTER TABLE "MoneyEntry"
ADD CONSTRAINT "MoneyEntry_original_currency_complete" CHECK (
  ("originalCurrency" IS NULL AND "originalAmount" IS NULL AND "exchangeRateToMvr" IS NULL) OR
  ("originalCurrency" ~ '^[A-Z]{3}$' AND "originalCurrency" <> 'MVR' AND "originalAmount" > 0 AND "exchangeRateToMvr" > 0)
);
