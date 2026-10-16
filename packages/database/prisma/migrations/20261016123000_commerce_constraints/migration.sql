ALTER TABLE "Order"
ADD CONSTRAINT "Order_orderNumber_positive" CHECK ("orderNumber" > 0),
ADD CONSTRAINT "Order_money_nonnegative" CHECK (
  "subtotal" >= 0 AND
  "discountAmount" >= 0 AND
  "discountAmount" <= "subtotal" AND
  "deliveryFee" >= 0 AND
  "total" >= 0
),
ADD CONSTRAINT "Order_total_consistent" CHECK (
  "total" = "subtotal" - "discountAmount" + "deliveryFee"
),
ADD CONSTRAINT "Order_currency_mvr" CHECK ("currency" = 'MVR');

ALTER TABLE "OrderLine"
ADD CONSTRAINT "OrderLine_quantity_positive" CHECK ("quantity" > 0),
ADD CONSTRAINT "OrderLine_money_nonnegative" CHECK (
  "unitPrice" >= 0 AND
  ("unitCost" IS NULL OR "unitCost" >= 0) AND
  "lineTotal" >= 0
),
ADD CONSTRAINT "OrderLine_total_consistent" CHECK (
  "lineTotal" = "unitPrice" * "quantity"
);

ALTER TABLE "Payment"
ADD CONSTRAINT "Payment_amount_positive" CHECK ("amount" > 0);

ALTER TABLE "PreorderDetail"
ADD CONSTRAINT "PreorderDetail_deposit_nonnegative" CHECK (
  "depositRequired" >= 0
);
