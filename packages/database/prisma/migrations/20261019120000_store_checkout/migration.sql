-- CreateEnum
CREATE TYPE "StockReservationStatus" AS ENUM ('ACTIVE', 'RELEASED', 'CONSUMED');

-- CreateEnum
CREATE TYPE "CheckoutPaymentMethod" AS ENUM ('BANK_TRANSFER', 'CASH_ON_DELIVERY');

-- CreateEnum
CREATE TYPE "DiscountSource" AS ENUM ('MANUAL', 'AMBASSADOR_CODE');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "phoneKey" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "ambassadorId" TEXT,
ADD COLUMN     "discountCode" TEXT,
ADD COLUMN     "discountPercent" DECIMAL(5,2),
ADD COLUMN     "discountSource" "DiscountSource",
ADD COLUMN     "intendedPaymentMethod" "CheckoutPaymentMethod",
ADD COLUMN     "publicToken" TEXT,
ALTER COLUMN "createdById" DROP NOT NULL;

-- CreateTable
CREATE TABLE "StockReservation" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderLineId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" "StockReservationStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),
    "consumedAt" TIMESTAMP(3),

    CONSTRAINT "StockReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderDelivery" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "instagramHandle" TEXT,
    "address" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "deliveryOptionId" TEXT,
    "methodName" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryOption" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreSettings" (
    "id" TEXT NOT NULL DEFAULT 'store',
    "storeOpen" BOOLEAN NOT NULL DEFAULT false,
    "announcement" TEXT,
    "reservationHours" INTEGER NOT NULL DEFAULT 24,
    "supportPhone" TEXT,
    "supportWhatsApp" TEXT,
    "instagramHandle" TEXT,
    "bankTransferInstructions" TEXT,
    "deliveryInstructions" TEXT,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductMedia" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "altText" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "status" "FileStatus" NOT NULL DEFAULT 'PENDING',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizedAt" TIMESTAMP(3),

    CONSTRAINT "ProductMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StockReservation_orderLineId_key" ON "StockReservation"("orderLineId");

-- CreateIndex
CREATE INDEX "StockReservation_variantId_status_expiresAt_idx" ON "StockReservation"("variantId", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "StockReservation_orderId_status_idx" ON "StockReservation"("orderId", "status");

-- CreateIndex
CREATE INDEX "StockReservation_status_expiresAt_idx" ON "StockReservation"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "OrderDelivery_orderId_key" ON "OrderDelivery"("orderId");

-- CreateIndex
CREATE INDEX "OrderDelivery_deliveryOptionId_idx" ON "OrderDelivery"("deliveryOptionId");

-- CreateIndex
CREATE INDEX "DeliveryOption_active_sortOrder_idx" ON "DeliveryOption"("active", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ProductMedia_storageKey_key" ON "ProductMedia"("storageKey");

-- CreateIndex
CREATE INDEX "ProductMedia_productId_status_sortOrder_idx" ON "ProductMedia"("productId", "status", "sortOrder");

-- CreateIndex
CREATE INDEX "Customer_phoneKey_idx" ON "Customer"("phoneKey");

-- CreateIndex
CREATE UNIQUE INDEX "Order_publicToken_key" ON "Order"("publicToken");

-- CreateIndex
CREATE INDEX "Order_ambassadorId_idx" ON "Order"("ambassadorId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_ambassadorId_fkey" FOREIGN KEY ("ambassadorId") REFERENCES "Ambassador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_orderLineId_fkey" FOREIGN KEY ("orderLineId") REFERENCES "OrderLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockReservation" ADD CONSTRAINT "StockReservation_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDelivery" ADD CONSTRAINT "OrderDelivery_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDelivery" ADD CONSTRAINT "OrderDelivery_deliveryOptionId_fkey" FOREIGN KEY ("deliveryOptionId") REFERENCES "DeliveryOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreSettings" ADD CONSTRAINT "StoreSettings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMedia" ADD CONSTRAINT "ProductMedia_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMedia" ADD CONSTRAINT "ProductMedia_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "StaffUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Backfill the Customer matching key with the same rule as normalizePhone()
-- in @set25/shared: digits only, drop a leading 00, drop the 960 country code
-- from 10-digit Maldivian numbers.
UPDATE "Customer"
SET "phoneKey" = NULLIF(
  CASE
    WHEN length(k) = 10 AND k LIKE '960%' THEN substr(k, 4)
    ELSE k
  END,
  ''
)
FROM (
  SELECT "id" AS cid,
         regexp_replace(regexp_replace("phone", '\D', '', 'g'), '^00', '') AS k
  FROM "Customer"
) AS normalized
WHERE "Customer"."id" = normalized.cid;

-- Staff-created orders keep an actor; only Store checkout orders (which carry
-- a public token) may have none.
ALTER TABLE "Order"
ADD CONSTRAINT "Order_actor_or_public_checkout" CHECK (
  "createdById" IS NOT NULL OR "publicToken" IS NOT NULL
),
ADD CONSTRAINT "Order_discount_percent_range" CHECK (
  "discountPercent" IS NULL OR ("discountPercent" >= 0 AND "discountPercent" <= 100)
),
ADD CONSTRAINT "Order_ambassador_code_snapshot" CHECK (
  "discountSource" IS DISTINCT FROM 'AMBASSADOR_CODE' OR
  ("discountCode" IS NOT NULL AND "discountPercent" IS NOT NULL)
);

ALTER TABLE "StockReservation"
ADD CONSTRAINT "StockReservation_quantity_positive" CHECK ("quantity" > 0),
ADD CONSTRAINT "StockReservation_released_consistent" CHECK (
  ("status" = 'RELEASED') = ("releasedAt" IS NOT NULL)
),
ADD CONSTRAINT "StockReservation_consumed_consistent" CHECK (
  ("status" = 'CONSUMED') = ("consumedAt" IS NOT NULL)
);

ALTER TABLE "DeliveryOption"
ADD CONSTRAINT "DeliveryOption_price_nonnegative" CHECK ("price" >= 0);

ALTER TABLE "StoreSettings"
ADD CONSTRAINT "StoreSettings_singleton" CHECK ("id" = 'store'),
ADD CONSTRAINT "StoreSettings_reservation_hours_range" CHECK (
  "reservationHours" >= 1 AND "reservationHours" <= 168
);

ALTER TABLE "ProductMedia"
ADD CONSTRAINT "ProductMedia_size_positive" CHECK ("sizeBytes" > 0),
ADD CONSTRAINT "ProductMedia_available_finalized" CHECK (
  "status" <> 'AVAILABLE' OR "finalizedAt" IS NOT NULL
);

-- Launch defaults. The Store stays closed until an Owner or Manager opens it.
INSERT INTO "StoreSettings" ("id", "storeOpen", "reservationHours", "updatedAt")
VALUES ('store', false, 24, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "DeliveryOption" ("id", "name", "description", "price", "active", "sortOrder", "updatedAt")
VALUES
  ('delivery_male', 'Malé', 'Delivery within Malé.', 0, false, 0, CURRENT_TIMESTAMP),
  ('delivery_hulhumale', 'Hulhumalé', 'Delivery within Hulhumalé.', 0, false, 1, CURRENT_TIMESTAMP),
  ('delivery_other', 'Other Maldives', 'Sent to your island by ferry or cargo. We confirm the arrangement with you.', 0, false, 2, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
