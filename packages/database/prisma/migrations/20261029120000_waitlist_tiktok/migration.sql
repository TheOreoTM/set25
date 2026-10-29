-- People who reach SET25 through TikTok are stored by their TikTok handle.
ALTER TABLE "WaitlistEntry" ADD COLUMN "tiktokHandle" TEXT;

-- Every entry needs someone to reach: an Instagram handle, a TikTok handle,
-- or a name.
ALTER TABLE "WaitlistEntry" DROP CONSTRAINT "WaitlistEntry_identity_present";
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_identity_present" CHECK ("instagramHandle" IS NOT NULL OR "tiktokHandle" IS NOT NULL OR "name" IS NOT NULL);
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_tiktok_handle_normalised" CHECK ("tiktokHandle" IS NULL OR "tiktokHandle" ~ '^[a-z0-9._]{2,24}$');

CREATE UNIQUE INDEX "WaitlistEntry_tiktokHandle_key" ON "WaitlistEntry"("tiktokHandle");
