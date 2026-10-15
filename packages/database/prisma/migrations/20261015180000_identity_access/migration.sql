CREATE TYPE "StaffRole" AS ENUM ('OWNER', 'MANAGER', 'STAFF');

CREATE TABLE "StaffUser" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "StaffRole" NOT NULL DEFAULT 'STAFF',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "lastLoginAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StaffUser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StaffUser_email_key" ON "StaffUser"("email");
CREATE INDEX "StaffUser_role_active_idx" ON "StaffUser"("role", "active");

ALTER TABLE "InventoryMovement" RENAME COLUMN "createdBy" TO "createdById";

-- The old field was a nullable future placeholder without a relation. Preserve
-- valid future IDs while safely clearing any legacy free-text value.
UPDATE "InventoryMovement" movement
SET "createdById" = NULL
WHERE "createdById" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "StaffUser" staff WHERE staff."id" = movement."createdById"
  );

CREATE INDEX "InventoryMovement_createdById_createdAt_idx"
ON "InventoryMovement"("createdById", "createdAt");

ALTER TABLE "InventoryMovement"
ADD CONSTRAINT "InventoryMovement_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "StaffUser"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
