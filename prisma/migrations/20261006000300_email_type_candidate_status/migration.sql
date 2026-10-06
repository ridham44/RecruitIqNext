-- Candidates have no login, so "interview completed" and "interview
-- cancelled" are emailed to them as well. Enum additions go in their own
-- migration (plan rule 6); guarded so re-running is harmless.

-- AlterEnum
ALTER TYPE "EmailType" ADD VALUE IF NOT EXISTS 'INTERVIEW_COMPLETED';

-- AlterEnum
ALTER TYPE "EmailType" ADD VALUE IF NOT EXISTS 'INTERVIEW_CANCELLED';
