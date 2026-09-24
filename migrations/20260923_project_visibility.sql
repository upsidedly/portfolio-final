BEGIN;

ALTER TABLE "payload"."projects"
  ADD COLUMN IF NOT EXISTS "hidden" boolean DEFAULT false;

UPDATE "payload"."projects"
SET "hidden" = false
WHERE "hidden" IS NULL;

ALTER TABLE "payload"."projects"
  ALTER COLUMN "hidden" SET DEFAULT false,
  ALTER COLUMN "hidden" SET NOT NULL;

COMMIT;
