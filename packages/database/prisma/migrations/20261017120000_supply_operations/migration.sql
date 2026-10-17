CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'PLACED', 'CLOSED', 'CANCELLED');
CREATE TYPE "ImportShipmentStatus" AS ENUM ('PLANNING', 'SUPPLIER_SHIPPING', 'CHINA_WAREHOUSE', 'READY_TO_SHIP', 'IN_TRANSIT', 'MALDIVES_CUSTOMS', 'READY_FOR_COLLECTION', 'RECEIVED', 'CANCELLED');
CREATE TYPE "CostAllocationMethod" AS ENUM ('BY_QUANTITY', 'BY_PRODUCT_VALUE');
CREATE TYPE "SampleStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'RETEST');

CREATE TABLE "Supplier" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "country" TEXT,
  "contactName" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "website" TEXT,
  "alibabaUrl" TEXT,
  "notes" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupplierProduct" (
  "id" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "productUrl" TEXT,
  "supplierSku" TEXT,
  "moq" INTEGER,
  "sampleCost" DECIMAL(12,2),
  "bulkUnitPrice" DECIMAL(12,2),
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "notes" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupplierProduct_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PurchaseOrder" (
  "id" TEXT NOT NULL,
  "purchaseOrderNumber" SERIAL NOT NULL,
  "supplierId" TEXT NOT NULL,
  "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
  "supplierReference" TEXT,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "exchangeRateToMvr" DECIMAL(18,6) NOT NULL,
  "placedAt" TIMESTAMP(3),
  "expectedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdById" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PurchaseOrderLine" (
  "id" TEXT NOT NULL,
  "purchaseOrderId" TEXT NOT NULL,
  "variantId" TEXT,
  "productName" TEXT NOT NULL,
  "productCode" TEXT NOT NULL,
  "sku" TEXT NOT NULL,
  "size" TEXT,
  "color" TEXT,
  "quantityOrdered" INTEGER NOT NULL,
  "quantityReceived" INTEGER NOT NULL DEFAULT 0,
  "unitCost" DECIMAL(12,4) NOT NULL,
  "currency" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PurchaseOrderLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ImportShipment" (
  "id" TEXT NOT NULL,
  "importNumber" SERIAL NOT NULL,
  "status" "ImportShipmentStatus" NOT NULL DEFAULT 'PLANNING',
  "freightForwarder" TEXT NOT NULL,
  "trackingReference" TEXT,
  "estimatedDeparture" TIMESTAMP(3),
  "departedAt" TIMESTAMP(3),
  "estimatedArrival" TIMESTAMP(3),
  "arrivedAt" TIMESTAMP(3),
  "receivedAt" TIMESTAMP(3),
  "chinaShippingMvr" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "internationalShippingMvr" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "taxFeesMvr" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "otherFeesMvr" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "costAllocationMethod" "CostAllocationMethod" NOT NULL DEFAULT 'BY_QUANTITY',
  "notes" TEXT,
  "createdById" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ImportShipment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ImportShipmentLine" (
  "id" TEXT NOT NULL,
  "importShipmentId" TEXT NOT NULL,
  "purchaseOrderLineId" TEXT NOT NULL,
  "quantityShipped" INTEGER NOT NULL,
  "quantityReceived" INTEGER NOT NULL DEFAULT 0,
  "allocatedSharedCostMvr" DECIMAL(12,2),
  "actualUnitCostMvr" DECIMAL(12,4),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ImportShipmentLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ImportShipmentEvent" (
  "id" TEXT NOT NULL,
  "importShipmentId" TEXT NOT NULL,
  "status" "ImportShipmentStatus" NOT NULL,
  "notes" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ImportShipmentEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Sample" (
  "id" TEXT NOT NULL,
  "sampleNumber" SERIAL NOT NULL,
  "supplierId" TEXT NOT NULL,
  "productId" TEXT,
  "variantId" TEXT,
  "name" TEXT NOT NULL,
  "sampleCost" DECIMAL(12,2),
  "currency" TEXT,
  "status" "SampleStatus" NOT NULL DEFAULT 'PENDING',
  "orderedAt" TIMESTAMP(3),
  "receivedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Sample_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SampleEvaluation" (
  "id" TEXT NOT NULL,
  "sampleId" TEXT NOT NULL,
  "testerName" TEXT NOT NULL,
  "quality" INTEGER NOT NULL,
  "comfort" INTEGER NOT NULL,
  "fit" INTEGER NOT NULL,
  "protection" INTEGER NOT NULL,
  "durability" INTEGER NOT NULL,
  "branding" INTEGER NOT NULL,
  "value" INTEGER NOT NULL,
  "notes" TEXT,
  "recordedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SampleEvaluation_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "PreorderDetail" ADD COLUMN "purchaseOrderId" TEXT;

CREATE INDEX "Supplier_name_idx" ON "Supplier"("name");
CREATE INDEX "Supplier_active_idx" ON "Supplier"("active");
CREATE UNIQUE INDEX "SupplierProduct_supplierId_productId_key" ON "SupplierProduct"("supplierId", "productId");
CREATE INDEX "SupplierProduct_productId_idx" ON "SupplierProduct"("productId");
CREATE INDEX "SupplierProduct_supplierId_active_idx" ON "SupplierProduct"("supplierId", "active");
CREATE UNIQUE INDEX "PurchaseOrder_purchaseOrderNumber_key" ON "PurchaseOrder"("purchaseOrderNumber");
CREATE UNIQUE INDEX "PurchaseOrder_idempotencyKey_key" ON "PurchaseOrder"("idempotencyKey");
CREATE INDEX "PurchaseOrder_supplierId_createdAt_idx" ON "PurchaseOrder"("supplierId", "createdAt");
CREATE INDEX "PurchaseOrder_status_expectedAt_idx" ON "PurchaseOrder"("status", "expectedAt");
CREATE INDEX "PurchaseOrderLine_purchaseOrderId_idx" ON "PurchaseOrderLine"("purchaseOrderId");
CREATE INDEX "PurchaseOrderLine_variantId_idx" ON "PurchaseOrderLine"("variantId");
CREATE UNIQUE INDEX "ImportShipment_importNumber_key" ON "ImportShipment"("importNumber");
CREATE UNIQUE INDEX "ImportShipment_idempotencyKey_key" ON "ImportShipment"("idempotencyKey");
CREATE INDEX "ImportShipment_status_estimatedArrival_idx" ON "ImportShipment"("status", "estimatedArrival");
CREATE INDEX "ImportShipment_createdAt_idx" ON "ImportShipment"("createdAt");
CREATE UNIQUE INDEX "ImportShipmentLine_importShipmentId_purchaseOrderLineId_key" ON "ImportShipmentLine"("importShipmentId", "purchaseOrderLineId");
CREATE INDEX "ImportShipmentLine_purchaseOrderLineId_idx" ON "ImportShipmentLine"("purchaseOrderLineId");
CREATE INDEX "ImportShipmentEvent_importShipmentId_createdAt_idx" ON "ImportShipmentEvent"("importShipmentId", "createdAt");
CREATE INDEX "ImportShipmentEvent_createdById_createdAt_idx" ON "ImportShipmentEvent"("createdById", "createdAt");
CREATE UNIQUE INDEX "Sample_sampleNumber_key" ON "Sample"("sampleNumber");
CREATE INDEX "Sample_supplierId_createdAt_idx" ON "Sample"("supplierId", "createdAt");
CREATE INDEX "Sample_status_createdAt_idx" ON "Sample"("status", "createdAt");
CREATE INDEX "Sample_productId_idx" ON "Sample"("productId");
CREATE INDEX "SampleEvaluation_sampleId_createdAt_idx" ON "SampleEvaluation"("sampleId", "createdAt");
CREATE INDEX "SampleEvaluation_recordedById_createdAt_idx" ON "SampleEvaluation"("recordedById", "createdAt");
CREATE INDEX "PreorderDetail_purchaseOrderId_idx" ON "PreorderDetail"("purchaseOrderId");

ALTER TABLE "SupplierProduct" ADD CONSTRAINT "SupplierProduct_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SupplierProduct" ADD CONSTRAINT "SupplierProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "StaffUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrderLine" ADD CONSTRAINT "PurchaseOrderLine_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PurchaseOrderLine" ADD CONSTRAINT "PurchaseOrderLine_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ImportShipment" ADD CONSTRAINT "ImportShipment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "StaffUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ImportShipmentLine" ADD CONSTRAINT "ImportShipmentLine_importShipmentId_fkey" FOREIGN KEY ("importShipmentId") REFERENCES "ImportShipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ImportShipmentLine" ADD CONSTRAINT "ImportShipmentLine_purchaseOrderLineId_fkey" FOREIGN KEY ("purchaseOrderLineId") REFERENCES "PurchaseOrderLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ImportShipmentEvent" ADD CONSTRAINT "ImportShipmentEvent_importShipmentId_fkey" FOREIGN KEY ("importShipmentId") REFERENCES "ImportShipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ImportShipmentEvent" ADD CONSTRAINT "ImportShipmentEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "StaffUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Sample" ADD CONSTRAINT "Sample_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Sample" ADD CONSTRAINT "Sample_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Sample" ADD CONSTRAINT "Sample_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Sample" ADD CONSTRAINT "Sample_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "StaffUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SampleEvaluation" ADD CONSTRAINT "SampleEvaluation_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "Sample"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SampleEvaluation" ADD CONSTRAINT "SampleEvaluation_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PreorderDetail" ADD CONSTRAINT "PreorderDetail_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SupplierProduct"
ADD CONSTRAINT "SupplierProduct_moq_positive" CHECK ("moq" IS NULL OR "moq" > 0),
ADD CONSTRAINT "SupplierProduct_costs_nonnegative" CHECK (("sampleCost" IS NULL OR "sampleCost" >= 0) AND ("bulkUnitPrice" IS NULL OR "bulkUnitPrice" >= 0));

ALTER TABLE "PurchaseOrder"
ADD CONSTRAINT "PurchaseOrder_number_positive" CHECK ("purchaseOrderNumber" > 0),
ADD CONSTRAINT "PurchaseOrder_exchange_rate_positive" CHECK ("exchangeRateToMvr" > 0);

ALTER TABLE "PurchaseOrderLine"
ADD CONSTRAINT "PurchaseOrderLine_quantities_valid" CHECK ("quantityOrdered" > 0 AND "quantityReceived" >= 0 AND "quantityReceived" <= "quantityOrdered"),
ADD CONSTRAINT "PurchaseOrderLine_cost_nonnegative" CHECK ("unitCost" >= 0);

ALTER TABLE "ImportShipment"
ADD CONSTRAINT "ImportShipment_number_positive" CHECK ("importNumber" > 0),
ADD CONSTRAINT "ImportShipment_costs_nonnegative" CHECK ("chinaShippingMvr" >= 0 AND "internationalShippingMvr" >= 0 AND "taxFeesMvr" >= 0 AND "otherFeesMvr" >= 0);

ALTER TABLE "ImportShipmentLine"
ADD CONSTRAINT "ImportShipmentLine_quantities_valid" CHECK ("quantityShipped" > 0 AND "quantityReceived" >= 0 AND "quantityReceived" <= "quantityShipped"),
ADD CONSTRAINT "ImportShipmentLine_costs_nonnegative" CHECK (("allocatedSharedCostMvr" IS NULL OR "allocatedSharedCostMvr" >= 0) AND ("actualUnitCostMvr" IS NULL OR "actualUnitCostMvr" >= 0));

ALTER TABLE "Sample"
ADD CONSTRAINT "Sample_number_positive" CHECK ("sampleNumber" > 0),
ADD CONSTRAINT "Sample_cost_nonnegative" CHECK ("sampleCost" IS NULL OR "sampleCost" >= 0);

ALTER TABLE "SampleEvaluation"
ADD CONSTRAINT "SampleEvaluation_scores_between_1_and_5" CHECK (
  "quality" BETWEEN 1 AND 5 AND
  "comfort" BETWEEN 1 AND 5 AND
  "fit" BETWEEN 1 AND 5 AND
  "protection" BETWEEN 1 AND 5 AND
  "durability" BETWEEN 1 AND 5 AND
  "branding" BETWEEN 1 AND 5 AND
  "value" BETWEEN 1 AND 5
);
