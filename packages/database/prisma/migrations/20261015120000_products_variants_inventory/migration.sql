CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
CREATE TYPE "ProductCategory" AS ENUM ('KNEE_PADS', 'ARM_SLEEVES', 'ATHLETIC_TAPE', 'GRIP_SOCKS', 'OTHER');
CREATE TYPE "InventoryMovementType" AS ENUM ('OPENING_STOCK', 'PURCHASE_RECEIVED', 'SALE', 'RETURN', 'MANUAL_ADJUSTMENT', 'DAMAGED', 'SAMPLE', 'GIVEAWAY');

ALTER TABLE "Product"
ADD COLUMN "slug" TEXT,
ADD COLUMN "shortDescription" TEXT,
ADD COLUMN "category" "ProductCategory" NOT NULL DEFAULT 'OTHER',
ADD COLUMN "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN "retailPrice" DECIMAL(10,2),
ADD COLUMN "isPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "brandLine" TEXT;

UPDATE "Product"
SET "slug" = lower(regexp_replace("code", '[^A-Za-z0-9]+', '-', 'g'));

UPDATE "Product" p
SET "retailPrice" = prices."price"
FROM (
  SELECT "productId", MIN("price") AS "price"
  FROM "ProductVariant"
  GROUP BY "productId"
) prices
WHERE p."id" = prices."productId";

UPDATE "Product" SET "retailPrice" = 0 WHERE "retailPrice" IS NULL;
ALTER TABLE "Product" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "Product" ALTER COLUMN "retailPrice" SET NOT NULL;

CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE INDEX "Product_status_idx" ON "Product"("status");
CREATE INDEX "Product_category_idx" ON "Product"("category");
CREATE INDEX "Product_isPublished_idx" ON "Product"("isPublished");

ALTER TABLE "ProductVariant" RENAME COLUMN "stock" TO "stockOnHand";
ALTER TABLE "ProductVariant" RENAME COLUMN "price" TO "sellPriceOverride";
ALTER TABLE "ProductVariant" ALTER COLUMN "sellPriceOverride" DROP NOT NULL;
ALTER TABLE "ProductVariant"
ADD COLUMN "reorderAt" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;

UPDATE "ProductVariant" v
SET "sellPriceOverride" = NULL
FROM "Product" p
WHERE v."productId" = p."id"
  AND v."sellPriceOverride" = p."retailPrice";

CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");
CREATE INDEX "ProductVariant_active_idx" ON "ProductVariant"("active");
CREATE INDEX "ProductVariant_stockOnHand_idx" ON "ProductVariant"("stockOnHand");

CREATE TABLE "InventoryMovement" (
  "id" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "type" "InventoryMovementType" NOT NULL,
  "quantityChange" INTEGER NOT NULL,
  "notes" TEXT NOT NULL,
  "reference" TEXT,
  "createdBy" TEXT,
  "idempotencyKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InventoryMovement_idempotencyKey_key" ON "InventoryMovement"("idempotencyKey");
CREATE INDEX "InventoryMovement_variantId_createdAt_idx" ON "InventoryMovement"("variantId", "createdAt");
CREATE INDEX "InventoryMovement_type_idx" ON "InventoryMovement"("type");

ALTER TABLE "InventoryMovement"
ADD CONSTRAINT "InventoryMovement_variantId_fkey"
FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
