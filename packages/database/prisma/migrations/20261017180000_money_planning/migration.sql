CREATE TYPE "MoneyDirection" AS ENUM ('IN', 'OUT');
CREATE TYPE "MoneyCategory" AS ENUM (
  'OWNER_FUNDING',
  'OTHER_INCOME',
  'REFUND_RECEIVED',
  'SUPPLIER_PAYMENT',
  'CHINA_SHIPPING',
  'INTERNATIONAL_SHIPPING',
  'TAX_FEES',
  'PACKAGING',
  'MARKETING',
  'DELIVERY',
  'SOFTWARE',
  'EQUIPMENT',
  'OTHER'
);
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'DOING', 'WAITING', 'DONE');
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

CREATE TABLE "MoneyEntry" (
  "id" TEXT NOT NULL,
  "direction" "MoneyDirection" NOT NULL,
  "category" "MoneyCategory" NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'MVR',
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "description" TEXT NOT NULL,
  "reference" TEXT,
  "notes" TEXT,
  "supplierId" TEXT,
  "purchaseOrderId" TEXT,
  "importShipmentId" TEXT,
  "orderId" TEXT,
  "createdById" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MoneyEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Task" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
  "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
  "dueAt" TIMESTAMP(3),
  "assignedToId" TEXT,
  "createdById" TEXT NOT NULL,
  "completedAt" TIMESTAMP(3),
  "orderId" TEXT,
  "purchaseOrderId" TEXT,
  "importShipmentId" TEXT,
  "supplierId" TEXT,
  "sampleId" TEXT,
  "customerId" TEXT,
  "teamId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MoneyEntry_idempotencyKey_key" ON "MoneyEntry"("idempotencyKey");
CREATE INDEX "MoneyEntry_occurredAt_idx" ON "MoneyEntry"("occurredAt");
CREATE INDEX "MoneyEntry_direction_occurredAt_idx" ON "MoneyEntry"("direction", "occurredAt");
CREATE INDEX "MoneyEntry_category_occurredAt_idx" ON "MoneyEntry"("category", "occurredAt");
CREATE INDEX "MoneyEntry_supplierId_occurredAt_idx" ON "MoneyEntry"("supplierId", "occurredAt");
CREATE INDEX "MoneyEntry_purchaseOrderId_occurredAt_idx" ON "MoneyEntry"("purchaseOrderId", "occurredAt");
CREATE INDEX "MoneyEntry_importShipmentId_occurredAt_idx" ON "MoneyEntry"("importShipmentId", "occurredAt");
CREATE INDEX "MoneyEntry_orderId_occurredAt_idx" ON "MoneyEntry"("orderId", "occurredAt");
CREATE INDEX "MoneyEntry_createdById_occurredAt_idx" ON "MoneyEntry"("createdById", "occurredAt");

CREATE INDEX "Task_status_dueAt_idx" ON "Task"("status", "dueAt");
CREATE INDEX "Task_priority_dueAt_idx" ON "Task"("priority", "dueAt");
CREATE INDEX "Task_assignedToId_status_dueAt_idx" ON "Task"("assignedToId", "status", "dueAt");
CREATE INDEX "Task_createdById_createdAt_idx" ON "Task"("createdById", "createdAt");
CREATE INDEX "Task_orderId_idx" ON "Task"("orderId");
CREATE INDEX "Task_purchaseOrderId_idx" ON "Task"("purchaseOrderId");
CREATE INDEX "Task_importShipmentId_idx" ON "Task"("importShipmentId");
CREATE INDEX "Task_supplierId_idx" ON "Task"("supplierId");
CREATE INDEX "Task_sampleId_idx" ON "Task"("sampleId");
CREATE INDEX "Task_customerId_idx" ON "Task"("customerId");
CREATE INDEX "Task_teamId_idx" ON "Task"("teamId");

ALTER TABLE "MoneyEntry" ADD CONSTRAINT "MoneyEntry_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MoneyEntry" ADD CONSTRAINT "MoneyEntry_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MoneyEntry" ADD CONSTRAINT "MoneyEntry_importShipmentId_fkey" FOREIGN KEY ("importShipmentId") REFERENCES "ImportShipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MoneyEntry" ADD CONSTRAINT "MoneyEntry_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MoneyEntry" ADD CONSTRAINT "MoneyEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "StaffUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "StaffUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_importShipmentId_fkey" FOREIGN KEY ("importShipmentId") REFERENCES "ImportShipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "Sample"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MoneyEntry"
ADD CONSTRAINT "MoneyEntry_amount_positive" CHECK ("amount" > 0),
ADD CONSTRAINT "MoneyEntry_currency_mvr" CHECK ("currency" = 'MVR'),
ADD CONSTRAINT "MoneyEntry_direction_category_valid" CHECK (
  ("direction" = 'IN' AND "category" IN ('OWNER_FUNDING', 'OTHER_INCOME', 'REFUND_RECEIVED')) OR
  ("direction" = 'OUT' AND "category" IN ('SUPPLIER_PAYMENT', 'CHINA_SHIPPING', 'INTERNATIONAL_SHIPPING', 'TAX_FEES', 'PACKAGING', 'MARKETING', 'DELIVERY', 'SOFTWARE', 'EQUIPMENT', 'OTHER'))
),
ADD CONSTRAINT "MoneyEntry_one_related_record" CHECK (
  num_nonnulls("supplierId", "purchaseOrderId", "importShipmentId", "orderId") <= 1
);

ALTER TABLE "Task"
ADD CONSTRAINT "Task_one_related_record" CHECK (
  num_nonnulls("orderId", "purchaseOrderId", "importShipmentId", "supplierId", "sampleId", "customerId", "teamId") <= 1
),
ADD CONSTRAINT "Task_completion_matches_status" CHECK (
  ("status" = 'DONE') = ("completedAt" IS NOT NULL)
);
