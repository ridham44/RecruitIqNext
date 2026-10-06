-- Brings a database created with the pre-baseline migration history (the 25
-- migrations up to 20261002090100_email_type_second_round) up to the
-- 20261006000000_init baseline: the Education model, email OTPs and the /recq
-- job fields. Every step is guarded, so on a database created from the
-- baseline (or one that already has some of these changes) it is a no-op.

-- CreateTable
CREATE TABLE IF NOT EXISTS "educations" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "fieldOfStudy" TEXT,
    "institution" TEXT,
    "startYear" INTEGER,
    "endYear" INTEGER,
    "isCurrentlyStudying" BOOLEAN NOT NULL DEFAULT false,
    "grade" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "educations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "educations_candidateId_idx" ON "educations"("candidateId");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'educations_candidateId_fkey') THEN
    ALTER TABLE "educations" ADD CONSTRAINT "educations_candidateId_fkey"
      FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Move the old flat academic columns on candidates into educations (one row
-- per candidate that had a degree and no education rows yet), then drop them.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'candidates' AND column_name = 'degree'
  ) THEN
    INSERT INTO "educations" ("id", "candidateId", "degree", "institution", "isCurrentlyStudying", "grade", "createdAt", "updatedAt")
    SELECT
      md5(random()::text || c."id" || clock_timestamp()::text),
      c."id",
      c."degree",
      COALESCE(NULLIF(c."college", ''), NULLIF(c."university", '')),
      COALESCE(c."academicStatus"::text = 'ONGOING', false),
      CASE WHEN c."latestSpi" IS NOT NULL THEN c."latestSpi"::text || ' CGPA' END,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    FROM "candidates" c
    WHERE NULLIF(TRIM(c."degree"), '') IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM "educations" e WHERE e."candidateId" = c."id");
  END IF;
END $$;

-- AlterTable
ALTER TABLE "candidates" DROP COLUMN IF EXISTS "academicStatus",
DROP COLUMN IF EXISTS "college",
DROP COLUMN IF EXISTS "currentSemester",
DROP COLUMN IF EXISTS "degree",
DROP COLUMN IF EXISTS "latestSpi",
DROP COLUMN IF EXISTS "university";

-- CreateTable
CREATE TABLE IF NOT EXISTS "email_otps" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'RECQ_APPLY',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "ip" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_otps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "email_otps_email_createdAt_idx" ON "email_otps"("email", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "email_otps_ip_createdAt_idx" ON "email_otps"("ip", "createdAt");

-- AlterTable
ALTER TABLE "guest_uploads" ADD COLUMN IF NOT EXISTS "recqMatches" JSONB;

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "interviewAvailabilityEnd" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "interviewAvailabilityStart" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "jobs_companyId_slug_key" ON "jobs"("companyId", "slug");
