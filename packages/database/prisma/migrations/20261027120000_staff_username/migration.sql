-- Staff sign in with a username instead of an email address.
ALTER TABLE "StaffUser" ADD COLUMN "username" TEXT;

-- Existing accounts keep working: each gets the part of its email before the
-- "@", reduced to the username alphabet. An unusable result falls back to
-- "staff", and any collision gets a numeric suffix (oldest account first).
WITH base AS (
  SELECT
    "id",
    "createdAt",
    left(
      regexp_replace(lower(split_part("email", '@', 1)), '[^a-z0-9._-]', '', 'g'),
      28
    ) AS candidate
  FROM "StaffUser"
),
usable AS (
  SELECT
    "id",
    "createdAt",
    CASE
      WHEN candidate ~ '^[a-z0-9][a-z0-9._-]{2,}$' THEN candidate
      ELSE 'staff'
    END AS candidate
  FROM base
),
ranked AS (
  SELECT
    "id",
    candidate,
    row_number() OVER (PARTITION BY candidate ORDER BY "createdAt", "id") AS n
  FROM usable
)
UPDATE "StaffUser" AS staff
SET "username" = CASE
  WHEN ranked.n = 1 THEN ranked.candidate
  ELSE ranked.candidate || '-' || ranked.n
END
FROM ranked
WHERE ranked."id" = staff."id";

ALTER TABLE "StaffUser" ALTER COLUMN "username" SET NOT NULL;
ALTER TABLE "StaffUser"
  ADD CONSTRAINT "StaffUser_username_format"
  CHECK ("username" ~ '^[a-z0-9][a-z0-9._-]{2,31}$');
CREATE UNIQUE INDEX "StaffUser_username_key" ON "StaffUser"("username");

DROP INDEX "StaffUser_email_key";
ALTER TABLE "StaffUser" DROP COLUMN "email";
