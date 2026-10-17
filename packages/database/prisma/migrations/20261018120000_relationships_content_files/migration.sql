-- CreateEnum
CREATE TYPE "AmbassadorStatus" AS ENUM ('PROSPECT', 'ACTIVE', 'PAUSED', 'ENDED');

-- CreateEnum
CREATE TYPE "ContentPlatform" AS ENUM ('INSTAGRAM', 'TIKTOK', 'BOTH');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('REEL', 'POST', 'CAROUSEL', 'STORY', 'PHOTO', 'OTHER');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('IDEA', 'CREATING', 'READY', 'SCHEDULED', 'POSTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('PENDING', 'AVAILABLE', 'DELETED');

-- CreateEnum
CREATE TYPE "FileAccessLevel" AS ENUM ('ALL_STAFF', 'MANAGER_AND_OWNER', 'OWNER_ONLY');

-- CreateEnum
CREATE TYPE "FileRetentionPolicy" AS ENUM ('PERMANENT', 'UNTIL_DATE');

-- CreateTable
CREATE TABLE "Ambassador" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "team" TEXT,
    "position" TEXT,
    "instagramHandle" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "status" "AmbassadorStatus" NOT NULL DEFAULT 'PROSPECT',
    "discountCode" TEXT,
    "discountPercent" DECIMAL(5,2),
    "commissionPercent" DECIMAL(5,2),
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ambassador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmbassadorProductGrant" (
    "id" TEXT NOT NULL,
    "ambassadorId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "inventoryMovementId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "productName" TEXT NOT NULL,
    "productCode" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "size" TEXT,
    "color" TEXT,
    "notes" TEXT,
    "givenAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AmbassadorProductGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "platform" "ContentPlatform" NOT NULL,
    "type" "ContentType" NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'IDEA',
    "hook" TEXT,
    "caption" TEXT,
    "notes" TEXT,
    "publishAt" TIMESTAMP(3),
    "postedAt" TIMESTAMP(3),
    "externalUrl" TEXT,
    "productId" TEXT,
    "ambassadorId" TEXT,
    "ownerId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileAsset" (
    "id" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "description" TEXT,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "status" "FileStatus" NOT NULL DEFAULT 'PENDING',
    "accessLevel" "FileAccessLevel" NOT NULL DEFAULT 'MANAGER_AND_OWNER',
    "retentionPolicy" "FileRetentionPolicy" NOT NULL DEFAULT 'PERMANENT',
    "retentionUntil" TIMESTAMP(3),
    "productId" TEXT,
    "customerId" TEXT,
    "teamId" TEXT,
    "orderId" TEXT,
    "supplierId" TEXT,
    "purchaseOrderId" TEXT,
    "importShipmentId" TEXT,
    "sampleId" TEXT,
    "ambassadorId" TEXT,
    "contentItemId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,

    CONSTRAINT "FileAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ambassador_discountCode_key" ON "Ambassador"("discountCode");

-- CreateIndex
CREATE INDEX "Ambassador_status_name_idx" ON "Ambassador"("status", "name");

-- CreateIndex
CREATE INDEX "Ambassador_name_idx" ON "Ambassador"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AmbassadorProductGrant_inventoryMovementId_key" ON "AmbassadorProductGrant"("inventoryMovementId");

-- CreateIndex
CREATE UNIQUE INDEX "AmbassadorProductGrant_idempotencyKey_key" ON "AmbassadorProductGrant"("idempotencyKey");

-- CreateIndex
CREATE INDEX "AmbassadorProductGrant_ambassadorId_givenAt_idx" ON "AmbassadorProductGrant"("ambassadorId", "givenAt");

-- CreateIndex
CREATE INDEX "AmbassadorProductGrant_variantId_idx" ON "AmbassadorProductGrant"("variantId");

-- CreateIndex
CREATE INDEX "AmbassadorProductGrant_createdById_createdAt_idx" ON "AmbassadorProductGrant"("createdById", "createdAt");

-- CreateIndex
CREATE INDEX "ContentItem_status_publishAt_idx" ON "ContentItem"("status", "publishAt");

-- CreateIndex
CREATE INDEX "ContentItem_publishAt_idx" ON "ContentItem"("publishAt");

-- CreateIndex
CREATE INDEX "ContentItem_platform_idx" ON "ContentItem"("platform");

-- CreateIndex
CREATE INDEX "ContentItem_ownerId_status_idx" ON "ContentItem"("ownerId", "status");

-- CreateIndex
CREATE INDEX "ContentItem_productId_idx" ON "ContentItem"("productId");

-- CreateIndex
CREATE INDEX "ContentItem_ambassadorId_idx" ON "ContentItem"("ambassadorId");

-- CreateIndex
CREATE UNIQUE INDEX "FileAsset_storageKey_key" ON "FileAsset"("storageKey");

-- CreateIndex
CREATE INDEX "FileAsset_status_createdAt_idx" ON "FileAsset"("status", "createdAt");

-- CreateIndex
CREATE INDEX "FileAsset_accessLevel_status_idx" ON "FileAsset"("accessLevel", "status");

-- CreateIndex
CREATE INDEX "FileAsset_retentionUntil_idx" ON "FileAsset"("retentionUntil");

-- CreateIndex
CREATE INDEX "FileAsset_createdById_createdAt_idx" ON "FileAsset"("createdById", "createdAt");

-- CreateIndex
CREATE INDEX "FileAsset_productId_idx" ON "FileAsset"("productId");

-- CreateIndex
CREATE INDEX "FileAsset_customerId_idx" ON "FileAsset"("customerId");

-- CreateIndex
CREATE INDEX "FileAsset_teamId_idx" ON "FileAsset"("teamId");

-- CreateIndex
CREATE INDEX "FileAsset_orderId_idx" ON "FileAsset"("orderId");

-- CreateIndex
CREATE INDEX "FileAsset_supplierId_idx" ON "FileAsset"("supplierId");

-- CreateIndex
CREATE INDEX "FileAsset_purchaseOrderId_idx" ON "FileAsset"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "FileAsset_importShipmentId_idx" ON "FileAsset"("importShipmentId");

-- CreateIndex
CREATE INDEX "FileAsset_sampleId_idx" ON "FileAsset"("sampleId");

-- CreateIndex
CREATE INDEX "FileAsset_ambassadorId_idx" ON "FileAsset"("ambassadorId");

-- CreateIndex
CREATE INDEX "FileAsset_contentItemId_idx" ON "FileAsset"("contentItemId");

-- AddForeignKey
ALTER TABLE "Ambassador" ADD CONSTRAINT "Ambassador_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "StaffUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmbassadorProductGrant" ADD CONSTRAINT "AmbassadorProductGrant_ambassadorId_fkey" FOREIGN KEY ("ambassadorId") REFERENCES "Ambassador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmbassadorProductGrant" ADD CONSTRAINT "AmbassadorProductGrant_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmbassadorProductGrant" ADD CONSTRAINT "AmbassadorProductGrant_inventoryMovementId_fkey" FOREIGN KEY ("inventoryMovementId") REFERENCES "InventoryMovement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmbassadorProductGrant" ADD CONSTRAINT "AmbassadorProductGrant_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "StaffUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_ambassadorId_fkey" FOREIGN KEY ("ambassadorId") REFERENCES "Ambassador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "StaffUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_importShipmentId_fkey" FOREIGN KEY ("importShipmentId") REFERENCES "ImportShipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "Sample"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_ambassadorId_fkey" FOREIGN KEY ("ambassadorId") REFERENCES "Ambassador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_contentItemId_fkey" FOREIGN KEY ("contentItemId") REFERENCES "ContentItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "StaffUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "StaffUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Integrity rules Prisma cannot express in the schema.
ALTER TABLE "Ambassador"
ADD CONSTRAINT "Ambassador_discount_percent_range" CHECK ("discountPercent" IS NULL OR ("discountPercent" >= 0 AND "discountPercent" <= 100)),
ADD CONSTRAINT "Ambassador_commission_percent_range" CHECK ("commissionPercent" IS NULL OR ("commissionPercent" >= 0 AND "commissionPercent" <= 100)),
ADD CONSTRAINT "Ambassador_discount_code_uppercase" CHECK ("discountCode" IS NULL OR "discountCode" = upper("discountCode")),
ADD CONSTRAINT "Ambassador_dates_ordered" CHECK ("startedAt" IS NULL OR "endedAt" IS NULL OR "endedAt" >= "startedAt");

ALTER TABLE "AmbassadorProductGrant"
ADD CONSTRAINT "AmbassadorProductGrant_quantity_positive" CHECK ("quantity" > 0);

ALTER TABLE "ContentItem"
ADD CONSTRAINT "ContentItem_scheduled_requires_publish_at" CHECK ("status" <> 'SCHEDULED' OR "publishAt" IS NOT NULL),
ADD CONSTRAINT "ContentItem_posted_matches_posted_at" CHECK (("status" = 'POSTED') = ("postedAt" IS NOT NULL));

ALTER TABLE "FileAsset"
ADD CONSTRAINT "FileAsset_size_positive" CHECK ("sizeBytes" > 0),
ADD CONSTRAINT "FileAsset_one_attachment" CHECK (
  num_nonnulls("productId", "customerId", "teamId", "orderId", "supplierId", "purchaseOrderId", "importShipmentId", "sampleId", "ambassadorId", "contentItemId") <= 1
),
ADD CONSTRAINT "FileAsset_retention_matches_policy" CHECK (
  ("retentionPolicy" = 'PERMANENT' AND "retentionUntil" IS NULL) OR
  ("retentionPolicy" = 'UNTIL_DATE' AND "retentionUntil" IS NOT NULL)
),
ADD CONSTRAINT "FileAsset_finalized_when_available" CHECK ("status" <> 'AVAILABLE' OR "finalizedAt" IS NOT NULL),
ADD CONSTRAINT "FileAsset_deleted_matches_status" CHECK (("status" = 'DELETED') = ("deletedAt" IS NOT NULL));
