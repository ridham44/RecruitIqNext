// Makes the /live-demo logins work: sets the password of the demo accounts
// listed on that page (src/shared/constants/demo.ts, all on .demo domains) to
// DEMO_PASSWORD, and re-activates them. Touches no other account or data.
//
//   npx tsx scripts/set-demo-password.mjs
//
// Pair it with DEMO_PAGE=true in .env so /live-demo shows the emails and
// the password. The demo data itself comes from scripts/seed-demo.mjs.
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { DEMO_ACCOUNTS } from '../src/shared/constants/demo.js';
import { RECQ_DEMO_DOMAINS } from './lib/recqDemoData.mjs';
import { passwordSchema } from '../src/shared/schemas/auth.schema.js';

const password = (process.env.DEMO_PASSWORD || 'Demo@123').trim();
const check = passwordSchema.safeParse(password);
if (!check.success) {
  console.error('DEMO_PASSWORD is not a valid password:', check.error.issues[0].message);
  process.exit(1);
}

// Only fixed demo accounts on .demo domains — never a real user.
const emails = DEMO_ACCOUNTS.map((a) => a.email.toLowerCase()).filter((e) =>
  RECQ_DEMO_DOMAINS.some((d) => e.endsWith(`@${d}`))
);

const prisma = new PrismaClient();
const passwordHash = await bcrypt.hash(password, 10);
for (const email of emails) {
  const r = await prisma.user.updateMany({ where: { email }, data: { passwordHash, isActive: true, passwordSet: true } });
  console.log(`${r.count ? 'updated' : 'MISSING'}  ${email}`);
}
await prisma.$disconnect();
console.log('\nDemo password set. Missing accounts mean the demo data is not seeded: run node scripts/seed-demo.mjs');
