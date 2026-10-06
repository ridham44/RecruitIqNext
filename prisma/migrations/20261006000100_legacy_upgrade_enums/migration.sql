-- Brings a database created with the pre-baseline migration history (the 25
-- migrations up to 20261002090100_email_type_second_round) up to the
-- 20261006000000_init baseline. On a database created from the baseline these
-- values already exist, so every statement is a no-op.
-- Enum additions go in their own migration (plan rule 6).

-- AlterEnum
ALTER TYPE "ApplicationSource" ADD VALUE IF NOT EXISTS 'RECQ';

-- AlterEnum
ALTER TYPE "EmailType" ADD VALUE IF NOT EXISTS 'OTP_VERIFICATION';
