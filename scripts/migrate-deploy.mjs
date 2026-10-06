// `prisma migrate deploy` that also works on a database created with the old
// migration history. The 25 step-by-step migrations were squashed into one
// baseline, prisma/migrations/20261006000000_init. A database that already ran
// the old history would fail on that baseline (its tables exist), so for such a
// database this first marks the baseline as applied; the legacy_upgrade
// migrations after it then add what the old history was missing.
//
//   node scripts/migrate-deploy.mjs      (deploy.sh runs this)
//
// New databases and databases already on the baseline get a plain
// `prisma migrate deploy`.
import 'dotenv/config';
import path from 'path';
import { spawnSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

const BASELINE = '20261006000000_init';
const LEGACY_HISTORY = [
  '20260921081913_init',
  '20260921090513_candidate_academic_profile',
  '20260921092630_job_score_settings',
  '20260921100635_resume_blob_storage',
  '20260921104457_phase2_notifications_scheduling',
  '20260921104902_interview_history_not_unique',
  '20260921114506_phase3_ai_interviews',
  '20260922061156_phase3_voice_difficulty_normalization',
  '20260923120000_add_job_details_fields',
  '20260928120000_p1_email_type_account_setup',
  '20260928120100_p1_platform_admin',
  '20260928150000_p2_company_members',
  '20260928153000_p2_member_full_name',
  '20260929090000_p3_clients_departments',
  '20260929130000_p4_careers_portal',
  '20260929160000_p5_email_type_interview_invite',
  '20260929160100_p5_instant_interview',
  '20260930090000_p6_recruiter_instructions',
  '20260930120000_p7_status_values',
  '20260930120100_p7_final_score_submissions',
  '20260930150000_p8_role_client_hr',
  '20260930150100_p8_hiring_person_user_fk',
  '20260930180000_hr_under_client_company',
  '20261002090000_interview_second_round',
  '20261002090100_email_type_second_round',
];

const prismaCli = path.resolve('node_modules', 'prisma', 'build', 'index.js');
const runPrisma = (args, opts = {}) => spawnSync(process.execPath, [prismaCli, ...args], { stdio: 'inherit', env: process.env, ...opts });
const fail = (message) => {
  console.error(`[migrate] ${message}`);
  process.exit(1);
};

// Names of the successfully applied migrations, or null for a new database.
async function appliedMigrations() {
  const db = new PrismaClient();
  try {
    const [{ present }] = await db.$queryRaw`SELECT to_regclass('_prisma_migrations') IS NOT NULL AS present`;
    if (!present) return null;
    const rows = await db.$queryRaw`SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`;
    return new Set(rows.map((r) => r.migration_name));
  } finally {
    await db.$disconnect();
  }
}

const applied = await appliedMigrations();

if (applied && !applied.has(BASELINE) && LEGACY_HISTORY.some((m) => applied.has(m))) {
  const missing = LEGACY_HISTORY.filter((m) => !applied.has(m));
  if (missing.length) {
    fail(
      `This database ran only part of the old migration history (${missing.length} missing, first: ${missing[0]}). ` +
        'Deploy commit 5262a3d first so it finishes the old history, then deploy this version.',
    );
  }
  console.log(`[migrate] Database uses the old migration history — marking the baseline ${BASELINE} as applied.`);
  if (runPrisma(['migrate', 'resolve', '--applied', BASELINE]).status !== 0) fail('prisma migrate resolve failed.');
} else if (applied && applied.size && !applied.has(BASELINE)) {
  fail(`Unrecognized migration history (no ${BASELINE} and none of the old migrations). Check _prisma_migrations before deploying.`);
}

if (runPrisma(['migrate', 'deploy']).status !== 0) fail('prisma migrate deploy failed.');

// The database should now match schema.prisma exactly; warn (don't fail) if not.
const diff = runPrisma(['migrate', 'diff', '--from-url', process.env.DATABASE_URL, '--to-schema-datamodel', 'prisma/schema.prisma', '--exit-code'], { stdio: 'ignore' });
if (diff.status === 2) {
  console.warn('[migrate] Warning: the database still differs from prisma/schema.prisma. Inspect with:');
  console.warn('  npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --script');
} else if (diff.status === 0) {
  console.log('[migrate] Database matches prisma/schema.prisma.');
}
