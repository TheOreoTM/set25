-- Pre-launch waitlist captured from Instagram DMs, TikTok, and in person.
CREATE TYPE "WaitlistSource" AS ENUM ('INSTAGRAM_DM', 'TIKTOK', 'IN_PERSON');
CREATE TYPE "WaitlistStatus" AS ENUM ('NEW', 'CONTACTED', 'CONFIRMED', 'ORDERED', 'DROPPED');

CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "instagramHandle" TEXT,
    "name" TEXT,
    "phone" TEXT,
    "source" "WaitlistSource" NOT NULL DEFAULT 'INSTAGRAM_DM',
    "interestedCategories" "ProductCategory"[],
    "sizes" TEXT[],
    "status" "WaitlistStatus" NOT NULL DEFAULT 'NEW',
    "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "earlyBird" BOOLEAN NOT NULL DEFAULT false,
    "earlyBirdCode" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id"),
    -- Every entry needs someone to reach: an Instagram handle or a name.
    CONSTRAINT "WaitlistEntry_identity_present" CHECK ("instagramHandle" IS NOT NULL OR "name" IS NOT NULL),
    CONSTRAINT "WaitlistEntry_handle_normalised" CHECK ("instagramHandle" IS NULL OR "instagramHandle" ~ '^[a-z0-9._]{1,30}$'),
    CONSTRAINT "WaitlistEntry_code_uppercase" CHECK ("earlyBirdCode" IS NULL OR "earlyBirdCode" = upper("earlyBirdCode"))
);

CREATE UNIQUE INDEX "WaitlistEntry_instagramHandle_key" ON "WaitlistEntry"("instagramHandle");
CREATE UNIQUE INDEX "WaitlistEntry_earlyBirdCode_key" ON "WaitlistEntry"("earlyBirdCode");
CREATE INDEX "WaitlistEntry_status_createdAt_idx" ON "WaitlistEntry"("status", "createdAt");
CREATE INDEX "WaitlistEntry_createdAt_idx" ON "WaitlistEntry"("createdAt");

ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "StaffUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
