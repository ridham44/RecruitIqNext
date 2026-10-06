// A complete, connected demo dataset for local development and demos, on top
// of prisma/seed.js + prisma/seed-demo-interviews.js:
//
//   - the "Start here" demo set (src/shared/constants/demo.ts): Portal Admin,
//     Demo Talent Agency, its company + Company HR, a recruiter, candidates
//   - the Nfs agency (ceo@nfs.com) with clients Ferrari and McLaren, their
//     Company HR (portal logins) and two agency recruiters, then
//     scripts/seed-nfs.mjs for its 4 jobs × 6 applicants
//   - a spread of pipeline states on those jobs and on Ravantra's React.js
//     Developer job: screened / shortlisted / rejected, interviews pending
//     (booked slot or instant link), in progress, cancelled and completed with
//     reports, final scores, QUALIFIED / NOT_QUALIFIED, submissions to Company
//     HR and a second round requested by Company HR
//   - a suspended agency for the Portal Admin screens
//
// No AI calls and no emails: everything is written straight to the database,
// and AI-authored fields say aiModel: 'demo-seed-data'. Every account uses the
// password below.
//
//   npm run db:seed && npm run db:seed:demo-interviews   (first)
//   npx tsx scripts/seed-full-demo.mjs                   (re-running replaces the same data)
//
// Refuses to write to a non-local DATABASE_URL unless --allow-remote is passed.
import 'dotenv/config';
import crypto from 'crypto';
import { spawnSync } from 'child_process';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { buildDocx, reactResumeLines, DOCX_MIME } from './lib/testDocx.mjs';
// The original single-job "Start here" demo set this script was written for.
// src/shared/constants/demo.ts now describes the /recq demo
// (scripts/seed-recq-demo.mjs), so the accounts this script creates are kept
// here.
const DEMO_EMAIL_DOMAIN = 'recruitiq.demo';
const DEMO_AGENCY_NAME = 'Demo Talent Agency';
const DEMO_AGENCY_SLUG = 'demo-agency';
const DEMO_COMPANY_NAME = 'Demo Software Pvt Ltd';
const DEMO_JOB_TITLE = 'Frontend Developer (Demo)';

const DEMO_ACCOUNTS = [
  {
    key: 'admin',
    role: 'ADMIN',
    label: 'Portal Admin',
    email: `admin@${DEMO_EMAIL_DOMAIN}`,
    fullName: 'Demo Portal Admin',
    canDo: ['Add and manage agencies', 'Suspend or reactivate an agency', 'See all users'],
  },
  {
    key: 'agency',
    role: 'COMPANY',
    label: 'Agency owner',
    email: `agency@${DEMO_EMAIL_DOMAIN}`,
    fullName: 'Demo Agency Owner',
    canDo: [
      'Post jobs and share the careers page',
      'AI screening, shortlist / reject',
      'Set up the AI interview, read reports',
      'Final score and Submit to company',
      'Manage companies, Company HR and agency recruiters',
    ],
  },
  {
    key: 'recruiter',
    role: 'RECRUITER',
    label: 'Agency recruiter',
    email: `recruiter@${DEMO_EMAIL_DOMAIN}`,
    fullName: 'Demo Recruiter',
    canDo: ['Works only on assigned jobs and companies', 'Only the permissions the agency owner ticked'],
  },
  {
    key: 'hr',
    role: 'CLIENT_HR',
    label: 'Company HR',
    email: `hr@${DEMO_EMAIL_DOMAIN}`,
    fullName: 'Demo Company HR',
    canDo: ['See candidates the agency sent', 'Scores, interview summary and CV (view only)'],
  },
  {
    key: 'candidate',
    role: 'CANDIDATE',
    label: 'Candidate',
    email: `candidate@${DEMO_EMAIL_DOMAIN}`,
    fullName: 'Demo Candidate',
    canDo: ['Profile and CV', 'Find jobs and apply', 'Track applications, take the AI interview'],
  },
];
import { buildSnapshot } from '../src/server/modules/submissions/submissions.service.js';
import { combineScores } from '../src/server/modules/submissions/finalScore.service.js';
import { env } from '../src/server/config/env.js';

const PASSWORD = 'Demo@1234';
const AI_TAG = 'demo-seed-data';
const LOCAL_ORIGIN = 'http://localhost:3001';
const NFS_OWNER_EMAIL = 'ceo@nfs.com'; // fixed by scripts/seed-nfs.mjs
const NFS_CANDIDATE_DOMAIN = 'nfsdemo.example';
const OWN_DOMAINS = [DEMO_EMAIL_DOMAIN, 'nfs-agency.example', 'ferrari-demo.example', 'mclaren-demo.example', 'stellarstaffing.example'];

const prisma = new PrismaClient();
const acct = Object.fromEntries(DEMO_ACCOUNTS.map((a) => [a.key, a]));

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const ago = (ms) => new Date(Date.now() - ms);
// Local date `days` from today at hh:mm.
function dayAt(days, hour, minute = 0) {
  const t = new Date(Date.now() + days * DAY);
  t.setHours(hour, minute, 0, 0);
  return t;
}
let passwordHash;
const pw = async () => (passwordHash ??= await bcrypt.hash(PASSWORD, 10));
const slugify = (name) => name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '');
const step = (t) => console.log(`\n== ${t}`);

function assertLocalDatabase() {
  const url = process.env.DATABASE_URL || '';
  let host = '';
  try {
    host = new URL(url).hostname;
  } catch {
    // fall through to the check below
  }
  if (!['localhost', '127.0.0.1', '::1', 'host.docker.internal'].includes(host) && !process.argv.includes('--allow-remote')) {
    throw new Error(`DATABASE_URL points at "${host || 'an unknown host'}". This script writes fake data — pass --allow-remote if that is really intended.`);
  }
}

// ─────────────────────────────────────────────────────────────
// Building blocks
// ─────────────────────────────────────────────────────────────

async function wipeOwnData() {
  const where = {
    OR: [...OWN_DOMAINS.map((d) => ({ email: { endsWith: `@${d}`, mode: 'insensitive' } })), { email: NFS_OWNER_EMAIL }],
  };
  const resumes = await prisma.resume.findMany({ where: { candidate: { user: where } }, select: { storageKey: true } });
  // Owner users cascade to their agency → clients, jobs, applications.
  const { count } = await prisma.user.deleteMany({ where });
  await prisma.resumeBlob.deleteMany({ where: { id: { in: resumes.map((r) => r.storageKey) } } });
  console.log(`Removed the previous run (${count} users).`);
}

async function createAgency({ email, name, ownerName, slug = null, status = 'ACTIVE', createdByAdminId = null, ...details }) {
  const owner = await prisma.user.create({
    data: {
      email,
      passwordHash: await pw(),
      role: 'COMPANY',
      company: { create: { name, slug, status, createdByAdminId, ...details } },
    },
    include: { company: true },
  });
  await prisma.companyMember.create({ data: { companyId: owner.company.id, userId: owner.id, role: 'OWNER', fullName: ownerName } });
  console.log(`  agency  ${name.padEnd(28)} ${email}${status === 'ACTIVE' ? '' : `  (${status})`}`);
  return { owner, agency: owner.company };
}

// A client company with one department and a Company HR who can log in to the portal.
async function createClient(agencyId, { name, industry, website, department, hr }) {
  const client = await prisma.clientCompany.create({
    data: {
      companyId: agencyId,
      name,
      industry,
      website,
      contactName: hr.fullName,
      contactEmail: hr.email,
      departments: { create: { name: department } },
    },
    include: { departments: true },
  });
  const dept = client.departments[0];
  const hrUser = await prisma.user.create({ data: { email: hr.email, passwordHash: await pw(), role: 'CLIENT_HR' } });
  const person = await prisma.hiringPerson.create({
    data: {
      clientCompanyId: client.id,
      departmentId: dept.id,
      fullName: hr.fullName,
      email: hr.email,
      phone: hr.phone ?? null,
      designation: hr.designation,
      userId: hrUser.id,
    },
  });
  console.log(`  client  ${name.padEnd(28)} HR ${hr.fullName} <${hr.email}>`);
  return { client, dept, hr: person, hrUser };
}

async function createRecruiter(agencyId, { email, fullName, permissions, jobIds = [], clientIds = [] }) {
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await pw(),
      role: 'RECRUITER',
      membership: { create: { companyId: agencyId, role: 'RECRUITER', fullName, permissions } },
    },
    include: { membership: true },
  });
  const memberId = user.membership.id;
  if (jobIds.length) await prisma.jobRecruiter.createMany({ data: jobIds.map((jobId) => ({ jobId, memberId })) });
  if (clientIds.length) await prisma.clientRecruiter.createMany({ data: clientIds.map((clientCompanyId) => ({ clientCompanyId, memberId })) });
  console.log(`  recruiter ${fullName.padEnd(26)} ${email}  [${permissions.join(', ')}]`);
  return user;
}

async function createCandidate({ fullName, email, phone, location, headline, skills, gender, education }) {
  const lines = reactResumeLines(fullName, email, phone);
  const docx = buildDocx(lines);
  const blob = await prisma.resumeBlob.create({ data: { data: docx } });
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await pw(),
      role: 'CANDIDATE',
      candidate: {
        create: {
          fullName,
          phone,
          location,
          headline,
          skills,
          gender,
          educations: { create: education },
          resumes: {
            create: {
              fileName: `${slugify(fullName).replace(/\./g, '_')}_cv.docx`,
              fileType: DOCX_MIME,
              fileSize: docx.length,
              storageKey: blob.id,
              rawText: lines.join('\n'),
              parsedData: {
                name: fullName,
                email,
                phone,
                skills,
                experience: [],
                education: [{ degree: education.degree, field: education.fieldOfStudy }],
                projects: [],
                certifications: [],
                totalExperienceYears: 2,
              },
              isPrimary: true,
            },
          },
        },
      },
    },
    include: { candidate: { include: { resumes: true } } },
  });
  return user.candidate;
}

function skillMatch(job, skills) {
  const has = new Set(skills.map((s) => s.toLowerCase()));
  const inCv = (s) => has.has(s.toLowerCase());
  return {
    matched: [...job.requiredSkills, ...job.preferredSkills].filter(inCv),
    missing: job.requiredSkills.filter((s) => !inCv(s)),
    requiredMatched: job.requiredSkills.filter(inCv),
    preferredMatched: job.preferredSkills.filter(inCv),
  };
}

// A COMPLETED screening result; sub-scores are derived around the overall score.
async function screen(application, job, candidate, score, { at = ago(6 * DAY), concerns } = {}) {
  const m = skillMatch(job, candidate.skills);
  const strong = score >= 70;
  const weak = score < 45;
  await prisma.screeningResult.create({
    data: {
      applicationId: application.id,
      status: 'COMPLETED',
      overallScore: score,
      skillMatchScore: Math.min(100, score + 4),
      experienceMatchScore: Math.max(0, score - 6),
      educationMatchScore: Math.min(100, score + 8),
      matchedSkills: m.matched,
      missingSkills: m.missing,
      strengths: m.matched.length
        ? [`Hands-on with ${m.matched.slice(0, 3).join(', ')}`, strong ? 'Experience level fits the role well' : 'Some relevant project experience']
        : ['Transferable problem-solving background'],
      concerns: concerns ?? (m.missing.length ? [`No clear evidence of ${m.missing.slice(0, 2).join(' or ')}`] : ['No significant gaps found']),
      reasoning: weak
        ? `${candidate.fullName}'s background is in a different area — only ${m.requiredMatched.length} of ${job.requiredSkills.length} required skills are evident in the CV.`
        : strong
          ? `${candidate.fullName} covers ${m.requiredMatched.length} of ${job.requiredSkills.length} required skills with directly relevant experience — a strong match for ${job.title}.`
          : `${candidate.fullName} covers ${m.requiredMatched.length} of ${job.requiredSkills.length} required skills; a reasonable match with some gaps worth probing in the interview.`,
      deterministicChecks: { requiredSkillsMatched: m.requiredMatched, requiredSkillsMissing: m.missing },
      aiModel: AI_TAG,
      screenedAt: at,
    },
  });
}

async function setStatus(application, status, extra = {}) {
  await prisma.application.update({ where: { id: application.id }, data: { status, ...extra } });
}

async function bookedSlot(job, start, status = 'BOOKED') {
  return prisma.interviewSlot.create({ data: { jobId: job.id, startTime: start, endTime: new Date(start.getTime() + 30 * MIN), status } });
}

async function availableSlots(job, starts) {
  await prisma.interviewSlot.createMany({
    data: starts.map((s) => ({ jobId: job.id, startTime: s, endTime: new Date(s.getTime() + 30 * MIN), status: 'AVAILABLE' })),
  });
}

// Candidate booked a slot; the interview is still to happen.
async function scheduleSlotInterview(application, job, start) {
  const slot = await bookedSlot(job, start);
  await prisma.interview.create({ data: { applicationId: application.id, slotId: slot.id, status: 'SCHEDULED', liveKitRoomName: `interview-demo-${slot.id}` } });
  await setStatus(application, 'INTERVIEW_SCHEDULED');
}

// Booked, then cancelled by the company — the candidate is back to SHORTLISTED.
async function cancelledSlotInterview(application, job, start) {
  const slot = await bookedSlot(job, start, 'CANCELLED');
  await prisma.interview.create({ data: { applicationId: application.id, slotId: slot.id, status: 'CANCELLED' } });
  await setStatus(application, 'SHORTLISTED');
}

// Same token scheme as instantInterview.service.ts, so the printed link works locally.
function linkTokenFor(interview) {
  return crypto.createHmac('sha256', env.jwtSecret).update(`interview-link:${interview.id}:${interview.inviteNonce}`).digest('hex');
}

// Instant interview link sent, not attended yet.
async function instantInvite(application, job, { sentAt = ago(DAY), keepStatus = false, round } = {}) {
  const created = await prisma.interview.create({
    data: {
      applicationId: application.id,
      status: 'SCHEDULED',
      inviteNonce: crypto.randomBytes(16).toString('hex'),
      inviteSentAt: sentAt,
      inviteSendCount: 1,
      inviteSendWindowAt: sentAt,
      inviteExpiresAt: new Date(sentAt.getTime() + (job.inviteValidDays || 7) * DAY),
      ...(round || {}),
    },
  });
  const token = linkTokenFor(created);
  await prisma.interview.update({ where: { id: created.id }, data: { accessTokenHash: sha256(token) } });
  if (!keepStatus) await setStatus(application, 'INTERVIEW_SCHEDULED');
  return `${LOCAL_ORIGIN}/interview/${token}`;
}

const TIER_SCORES = {
  strong: [88, 84, 91, 82, 86],
  medium: [78, 55, 74, 48, 70],
  weak: [42, 30, 38, 26, 35],
};

// A finished AI interview with questions, answers, events and a COMPLETED report.
async function completedInterview(application, job, candidate, { startedAt, bank, tier, report, slot = true, extraEvents = [], criteria = null }) {
  const slotRow = slot ? await bookedSlot(job, startedAt) : null;
  const interview = await prisma.interview.create({
    data: {
      applicationId: application.id,
      slotId: slotRow?.id ?? null,
      status: 'COMPLETED',
      stage: 'END',
      liveKitRoomName: `interview-demo-${application.id}`,
      startedAt,
      ...(slot ? {} : { inviteNonce: crypto.randomBytes(16).toString('hex'), inviteSentAt: new Date(startedAt.getTime() - DAY), inviteSendCount: 1 }),
    },
  });

  let cursor = startedAt.getTime();
  const turns = [
    {
      stage: 'INTRODUCTION',
      type: 'INTRODUCTION',
      difficulty: null,
      q: `Hi ${candidate.fullName.split(' ')[0]}, thanks for joining. Could you briefly introduce yourself and your recent work?`,
      a: `Sure. I'm ${candidate.fullName}, currently working as ${candidate.headline || 'a developer'}. Most of my recent work has been with ${candidate.skills.slice(0, 3).join(', ')}.`,
      score: null,
    },
    ...bank.map((b, i) => {
      const score = TIER_SCORES[tier][i % 5];
      return { ...b, a: score >= 60 ? b.strong : b.weak, score };
    }),
  ];

  const questionAnalysis = [];
  for (const [i, t] of turns.entries()) {
    const askedAt = new Date(cursor);
    const duration = t.score == null ? 25 : t.score >= 60 ? 48 : 22;
    const question = await prisma.interviewQuestion.create({
      data: { interviewId: interview.id, index: i, stage: t.stage, type: t.type, text: t.q, difficulty: t.difficulty, answerTimeLimitSeconds: 60, askedAt },
    });
    await prisma.interviewAnswer.create({
      data: {
        questionId: question.id,
        transcript: t.a,
        rawTranscript: t.a,
        normalizedTranscript: t.a,
        durationSeconds: duration,
        evaluation: t.score == null ? null : { needsFollowUp: false, followUpQuestion: '', relevance: Math.min(100, t.score + 5), missingConcepts: [], note: '' },
        answeredAt: new Date(cursor + duration * 1000),
      },
    });
    if (t.score != null) {
      questionAnalysis.push({
        questionId: question.id,
        question: t.q,
        answerSummary: t.a.slice(0, 160),
        correctness: t.score,
        relevance: Math.min(100, t.score + 5),
        technicalDepth: Math.max(0, t.score - 4),
        communication: Math.min(100, t.score + 6),
        score: t.score,
        strengths: t.score >= 60 ? ['Clear, concrete answer'] : [],
        missingConcepts: t.score >= 60 ? [] : ['Lacked depth and concrete examples'],
        evaluationReason: t.score >= 75 ? 'Accurate and well-structured, with practical detail.' : t.score >= 60 ? 'Mostly correct, a little light on detail.' : 'Vague or partly incorrect; little hands-on evidence.',
      });
    }
    cursor += 2.5 * MIN;
  }
  const endedAt = new Date(cursor);
  await prisma.interview.update({ where: { id: interview.id }, data: { plannedQuestionIndex: turns.length - 1, endedAt } });

  const m = skillMatch(job, candidate.skills);
  await prisma.interviewReport.create({
    data: {
      interviewId: interview.id,
      status: 'COMPLETED',
      overallScore: report.overall,
      technicalScore: report.technical,
      communicationScore: report.communication,
      strengths: report.strengths,
      areasForImprovement: report.areas,
      questionAnalysis,
      resumeAlignment: {
        requiredSkillsMatched: m.requiredMatched,
        requiredSkillsMissing: m.missing,
        requiredSkillMatchScore: Math.round((m.requiredMatched.length / Math.max(1, job.requiredSkills.length)) * 100),
        preferredSkillsMatched: m.preferredMatched,
        preferredSkillMatchScore: Math.round((m.preferredMatched.length / Math.max(1, job.preferredSkills.length)) * 100),
      },
      criteriaAssessment: criteria,
      reasoning: report.reasoning,
      aiModel: AI_TAG,
      generatedAt: new Date(endedAt.getTime() + 2 * MIN),
    },
  });

  const events = [
    { type: 'INTERVIEW_STARTED', occurredAt: startedAt },
    { type: 'CAMERA_ON', occurredAt: new Date(startedAt.getTime() + 5000) },
    { type: 'MIC_ON', occurredAt: new Date(startedAt.getTime() + 8000) },
    ...extraEvents.map((e) => ({ type: e.type, occurredAt: new Date(startedAt.getTime() + e.atMin * MIN) })),
    { type: 'INTERVIEW_ENDED', occurredAt: endedAt },
  ];
  await prisma.interviewEvent.createMany({ data: events.map((e) => ({ interviewId: interview.id, ...e })) });
  await setStatus(application, 'INTERVIEW_COMPLETED');
  return interview;
}

// Interview happening right now: a few questions answered so far.
async function inProgressInterview(application, job, candidate, bank) {
  const startedAt = ago(12 * MIN);
  const slot = await bookedSlot(job, ago(15 * MIN));
  const interview = await prisma.interview.create({
    data: {
      applicationId: application.id,
      slotId: slot.id,
      status: 'IN_PROGRESS',
      stage: 'BASIC_TECHNICAL',
      liveKitRoomName: `interview-demo-${slot.id}`,
      plannedQuestionIndex: 2,
      startedAt,
    },
  });
  const turns = [
    { stage: 'INTRODUCTION', type: 'INTRODUCTION', difficulty: null, q: `Hi ${candidate.fullName.split(' ')[0]}, could you introduce yourself?`, a: `I'm ${candidate.fullName}, ${candidate.headline}.` },
    { ...bank[0], a: bank[0].strong },
    { ...bank[1], a: bank[1].strong },
  ];
  for (const [i, t] of turns.entries()) {
    const askedAt = new Date(startedAt.getTime() + i * 3 * MIN);
    const q = await prisma.interviewQuestion.create({
      data: { interviewId: interview.id, index: i, stage: t.stage, type: t.type, text: t.q, difficulty: t.difficulty, answerTimeLimitSeconds: 60, askedAt },
    });
    await prisma.interviewAnswer.create({
      data: { questionId: q.id, transcript: t.a, rawTranscript: t.a, normalizedTranscript: t.a, durationSeconds: 40, answeredAt: new Date(askedAt.getTime() + 40000) },
    });
  }
  await prisma.interviewEvent.createMany({
    data: [
      { interviewId: interview.id, type: 'INTERVIEW_STARTED', occurredAt: startedAt },
      { interviewId: interview.id, type: 'CAMERA_ON', occurredAt: new Date(startedAt.getTime() + 4000) },
      { interviewId: interview.id, type: 'MIC_ON', occurredAt: new Date(startedAt.getTime() + 6000) },
    ],
  });
  await setStatus(application, 'INTERVIEW_SCHEDULED');
}

// Final score exactly as finalScore.service.ts computes it; QUALIFIED /
// NOT_QUALIFIED only when the job has a finalThreshold.
async function applyFinalScore(application, job, cvScore, interviewScore) {
  const finalScore = combineScores({ cvScore, interviewScore, cvWeight: job.cvWeight, interviewWeight: job.interviewWeight });
  const status = job.finalThreshold == null ? undefined : finalScore >= job.finalThreshold ? 'QUALIFIED' : 'NOT_QUALIFIED';
  await prisma.application.update({ where: { id: application.id }, data: { finalScore, finalScoredAt: new Date(), ...(status ? { status } : {}) } });
  return finalScore;
}

// Same include as submissions.service.ts, so buildSnapshot sees what the app would send.
const SUBMISSION_INCLUDE = {
  candidate: { include: { user: { select: { email: true } } } },
  resume: { select: { id: true, fileName: true, fileType: true, parsedData: true } },
  screeningResult: true,
  job: {
    include: {
      company: { select: { id: true, name: true } },
      clientCompany: { select: { id: true, name: true } },
      department: { select: { id: true, name: true } },
      hiringPerson: { select: { id: true, fullName: true, email: true, isActive: true, departmentId: true } },
    },
  },
  interviews: {
    where: { status: 'COMPLETED' },
    include: { report: true, questions: { include: { answer: true }, orderBy: { askedAt: 'asc' } } },
    orderBy: { endedAt: 'desc' },
    take: 1,
  },
};

async function submitToHr(application, hr, submittedById, { note = null, sentAt = ago(2 * DAY), viewedAt = null } = {}) {
  const full = await prisma.application.findUnique({ where: { id: application.id }, include: SUBMISSION_INCLUDE });
  await prisma.clientSubmission.create({
    data: {
      applicationId: application.id,
      clientCompanyId: hr.clientCompanyId,
      departmentId: hr.departmentId,
      hiringPersonId: hr.id,
      recipientName: hr.fullName,
      recipientEmail: hr.email,
      submittedById,
      note,
      snapshot: buildSnapshot(full, { note }),
      status: viewedAt ? 'VIEWED' : 'SENT',
      viewedAt,
      accessTokenHash: sha256(crypto.randomBytes(32).toString('hex')),
      createdAt: sentAt,
    },
  });
  await setStatus(application, 'SUBMITTED_TO_CLIENT');
}

// ─────────────────────────────────────────────────────────────
// Interview question banks (strong / weak answers)
// ─────────────────────────────────────────────────────────────

const BANK_FULLSTACK = [
  {
    stage: 'RESUME_QUESTIONS', type: 'RESUME_BASED', difficulty: 'MEDIUM',
    q: 'Your CV mentions real-time dashboards. How did you push live data from the backend to the React UI?',
    strong: 'We used a Node.js WebSocket gateway in front of Kafka. The React side subscribed per channel, buffered messages and rendered at most every 100 ms with requestAnimationFrame, so the UI stayed smooth at a few thousand updates per second.',
    weak: 'We mostly polled the API every few seconds with setInterval. It worked fine for our use case, I did not really work on the backend side.',
  },
  {
    stage: 'BASIC_TECHNICAL', type: 'TECHNICAL', difficulty: 'MEDIUM',
    q: 'How do you avoid unnecessary re-renders in a React component that receives a high-frequency data stream?',
    strong: 'Keep the stream outside React state — in a ref or an external store with useSyncExternalStore — memoise derived values, split the component so only the chart re-renders, and throttle updates to the frame rate.',
    weak: 'I would wrap the component in React.memo, that should stop it from re-rendering.',
  },
  {
    stage: 'JOB_SPECIFIC', type: 'JOB_SPECIFIC', difficulty: 'HARD',
    q: 'Telemetry arrives at 200 Hz from 20 sensors per car. How would you store it in PostgreSQL so race engineers can query laps quickly?',
    strong: 'Batch inserts with COPY into a table partitioned by session and time, a BRIN index on the timestamp, and pre-aggregated per-lap rollups in a materialised view refreshed after each lap. Raw data goes to cold storage after the weekend.',
    weak: 'I would create a table with a column per sensor and add an index on the car id.',
  },
  {
    stage: 'SCENARIO', type: 'SCENARIO', difficulty: 'MEDIUM',
    q: 'During a live session the WebSocket server restarts. What should the client do so engineers do not lose data?',
    strong: 'Reconnect with exponential backoff, resume from the last sequence number the client acknowledged, and backfill the gap over REST. The UI shows a reconnecting banner instead of silently freezing.',
    weak: 'The user can refresh the page and it will connect again.',
  },
  {
    stage: 'BEHAVIORAL', type: 'BEHAVIORAL', difficulty: null,
    q: 'Tell me about a time you disagreed with a technical decision. What did you do?',
    strong: 'Our team wanted to rewrite a service in a new framework before a launch. I put together a small benchmark showing the current one was not the bottleneck, we agreed to fix the slow query first and revisit after launch.',
    weak: 'I usually go with what the senior developers decide.',
  },
];

const BANK_EMBEDDED = [
  {
    stage: 'RESUME_QUESTIONS', type: 'RESUME_BASED', difficulty: 'MEDIUM',
    q: 'You list CAN bus experience. How did you handle message priorities and bus load on your last project?',
    strong: 'We assigned lower IDs to safety-critical frames, kept bus load under 60 percent with a DBC review, and used hardware filters so the MCU only woke for frames it needed.',
    weak: 'We used a library that handled CAN messages, I mostly read values from it.',
  },
  {
    stage: 'BASIC_TECHNICAL', type: 'TECHNICAL', difficulty: 'MEDIUM',
    q: 'What is priority inversion in an RTOS and how do you prevent it?',
    strong: 'A low-priority task holds a mutex a high-priority task needs while a medium task pre-empts it. Priority inheritance on the mutex, or a priority ceiling protocol, fixes it — and keeping critical sections short.',
    weak: 'It is when tasks have the wrong priority set. You fix it by changing the priorities.',
  },
  {
    stage: 'JOB_SPECIFIC', type: 'JOB_SPECIFIC', difficulty: 'HARD',
    q: 'How would you design the torque-request path for a vehicle control unit to meet ISO 26262 requirements?',
    strong: 'Dual-channel plausibility checks on the pedal sensors, end-to-end protection with CRC and counters on the CAN frames, a watchdog with a safe torque-off state, and traceable requirements down to unit tests at the ASIL level from the HARA.',
    weak: 'I would add error checking and make sure the code is well tested.',
  },
  {
    stage: 'SCENARIO', type: 'SCENARIO', difficulty: 'MEDIUM',
    q: 'A sensor occasionally reports a spike for one sample. How do you handle it in firmware?',
    strong: 'Range and rate-of-change checks first, then a median-of-three filter so a single outlier is dropped without adding much latency, and a diagnostic counter that raises a DTC if it keeps happening.',
    weak: 'I would average the last ten readings.',
  },
  {
    stage: 'BEHAVIORAL', type: 'BEHAVIORAL', difficulty: null,
    q: 'Describe a hard bug you tracked down on hardware.',
    strong: 'A random reset turned out to be a stack overflow in an ISR. I enabled stack painting, found the high-water mark and moved a large buffer out of the interrupt context.',
    weak: 'We had an issue with the board resetting; the hardware team changed the board and it went away.',
  },
];

const BANK_FRONTEND = [
  {
    stage: 'RESUME_QUESTIONS', type: 'RESUME_BASED', difficulty: 'EASY',
    q: 'Walk me through a React feature you built end to end.',
    strong: 'I built a filterable orders table: API integration with pagination, URL-synced filters, skeleton loading states and a responsive card layout on mobile. I also wrote tests for the filter logic.',
    weak: 'I made some pages with React for a college project.',
  },
  {
    stage: 'BASIC_TECHNICAL', type: 'TECHNICAL', difficulty: 'MEDIUM',
    q: 'What is the difference between useEffect and useLayoutEffect?',
    strong: 'useEffect runs after the browser paints; useLayoutEffect runs synchronously after DOM changes but before paint, so it is for measuring layout without flicker. Most effects should use useEffect.',
    weak: 'They are basically the same, one is for layouts.',
  },
  {
    stage: 'JOB_SPECIFIC', type: 'JOB_SPECIFIC', difficulty: 'MEDIUM',
    q: 'How would you make a page with a large product list feel fast?',
    strong: 'Paginate or virtualise the list, lazy-load images with proper sizes, memoise expensive rows, and prefetch the next page. I would check it with Lighthouse and the React profiler.',
    weak: 'Use a faster server.',
  },
  {
    stage: 'SCENARIO', type: 'SCENARIO', difficulty: 'MEDIUM',
    q: 'An API call sometimes returns an error. How should the UI handle it?',
    strong: 'Show a clear inline error with a retry button, keep the previous data visible, log the error, and retry idempotent GETs automatically with backoff.',
    weak: 'Show an alert saying something went wrong.',
  },
  {
    stage: 'BEHAVIORAL', type: 'BEHAVIORAL', difficulty: null,
    q: 'How do you handle feedback in code reviews?',
    strong: 'I ask questions when I do not understand the reason, fix what is agreed quickly, and note patterns so I do not repeat them.',
    weak: 'I just change whatever the reviewer says.',
  },
];

const BANK_DATA = [
  {
    stage: 'RESUME_QUESTIONS', type: 'RESUME_BASED', difficulty: 'MEDIUM',
    q: 'Tell me about the Kafka pipeline on your CV — what was the throughput and how did you guarantee ordering?',
    strong: 'About 50k events per second; we partitioned by car and session so ordering held per key, and used idempotent producers with exactly-once sinks into the lake.',
    weak: 'We had a Kafka topic and Spark read from it.',
  },
  {
    stage: 'BASIC_TECHNICAL', type: 'TECHNICAL', difficulty: 'MEDIUM',
    q: 'How do you handle late-arriving events in a streaming aggregation?',
    strong: 'Event-time windows with a watermark sized from the observed lateness, plus a side output for very late events that a batch job reconciles.',
    weak: 'I am not sure, I would probably ignore them.',
  },
];

// ─────────────────────────────────────────────────────────────
// Seed sections
// ─────────────────────────────────────────────────────────────

async function seedAdmins() {
  step('Portal Admin');
  const admin = await prisma.user.create({ data: { email: acct.admin.email, passwordHash: await pw(), role: 'ADMIN' } });
  console.log(`  admin   ${acct.admin.email}`);
  return admin;
}

async function seedDemoAgency() {
  step(`"Start here" demo set — ${DEMO_AGENCY_NAME}`);
  const { owner, agency } = await createAgency({
    email: acct.agency.email,
    name: DEMO_AGENCY_NAME,
    ownerName: acct.agency.fullName,
    slug: DEMO_AGENCY_SLUG,
    industry: 'Recruitment',
    location: 'Pune, India',
  });
  const { client, dept, hr } = await createClient(agency.id, {
    name: DEMO_COMPANY_NAME,
    industry: 'Software',
    website: 'https://example.com',
    department: 'Engineering',
    hr: { fullName: acct.hr.fullName, email: acct.hr.email, designation: 'HR Manager' },
  });
  const job = await prisma.job.create({
    data: {
      companyId: agency.id,
      createdBy: owner.id,
      title: DEMO_JOB_TITLE,
      description:
        'Build and maintain React front-ends with JavaScript, HTML and CSS, working with REST APIs. ' +
        'You will collaborate with designers and backend engineers, write clean reusable components and keep pages fast and accessible.',
      minimumExperience: 1,
      maximumExperience: 5,
      requiredSkills: ['React', 'JavaScript', 'HTML', 'CSS'],
      preferredSkills: ['REST APIs', 'Git'],
      location: 'Pune',
      workMode: 'Hybrid',
      status: 'OPEN',
      interviewFlow: 'INSTANT',
      finalThreshold: 70,
      clientCompanyId: client.id,
      departmentId: dept.id,
      hiringPersonId: hr.id,
      aiInterviewConfig: { create: { aiName: 'Priya', aiTitle: 'Virtual HR', questionCount: 6 } },
    },
  });
  await createRecruiter(agency.id, {
    email: acct.recruiter.email,
    fullName: acct.recruiter.fullName,
    permissions: ['REVIEW_CANDIDATES', 'CONFIGURE_INTERVIEWS', 'MANAGE_CLIENTS'],
    jobIds: [job.id],
    clientIds: [client.id],
  });

  // Candidates have no login: a live demo applies through the /recq link
  // instead (upload a sample resume from public/sample-resumes).
  const education = { degree: 'B.E.', fieldOfStudy: 'Computer Engineering', institution: 'Pune Institute of Computer Technology', startYear: 2018, endYear: 2022, grade: '8.1 CGPA' };

  // Sample candidate already interviewed and sent to the Company HR, so their portal isn't empty.
  const sample = await createCandidate({
    fullName: 'Priya Sample', email: `sample.candidate@${DEMO_EMAIL_DOMAIN}`, phone: '+919800000002', location: 'Pune',
    headline: 'Frontend Developer', skills: ['React', 'JavaScript', 'HTML', 'CSS', 'REST APIs', 'Git'], gender: 'FEMALE', education,
  });
  const app = await prisma.application.create({ data: { candidateId: sample.id, jobId: job.id, resumeId: sample.resumes[0].id, createdAt: ago(5 * DAY) } });
  await screen(app, job, sample, 78, { at: ago(5 * DAY) });
  await completedInterview(app, job, sample, {
    startedAt: dayAt(-3, 16), bank: BANK_FRONTEND, tier: 'strong', slot: false,
    report: {
      overall: 84, technical: 82, communication: 87,
      strengths: ['Solid grasp of React hooks and rendering', 'Thinks about loading and error states', 'Clear, structured communicator'],
      areas: ['Limited exposure to automated testing at scale'],
      reasoning: 'Priya gave accurate, practical answers across React fundamentals and performance, with good product sense. A strong fit for a mid-level frontend role.',
    },
  });
  await applyFinalScore(app, job, 78, 84);
  await submitToHr(app, hr, owner.id, { note: 'Strong React fundamentals — recommended for the technical round.' });
  console.log('  candidate Priya Sample                sample.candidate@recruitiq.demo  (interviewed, QUALIFIED → sent to Company HR)');
}

async function seedNfsAgency(adminId) {
  step('Nfs agency — Ferrari & McLaren');
  const { owner, agency } = await createAgency({
    email: NFS_OWNER_EMAIL,
    name: 'Nfs',
    ownerName: 'Nikhil Sharma',
    slug: 'nfs',
    createdByAdminId: adminId,
    industry: 'Motorsport recruitment',
    location: 'Mumbai, India',
    website: 'https://nfs.example',
    description: 'Specialist recruitment partner for motorsport engineering teams.',
  });
  const ferrari = await createClient(agency.id, {
    name: 'Ferrari', industry: 'Automotive / Motorsport', website: 'https://ferrari.example', department: 'Scuderia Ferrari',
    hr: { fullName: 'Rachel', email: 'rachel@ferrari-demo.example', designation: 'Talent Acquisition Lead', phone: '+390536000001' },
  });
  const mclaren = await createClient(agency.id, {
    name: 'McLaren', industry: 'Automotive / Motorsport', website: 'https://mclaren.example', department: 'McLaren Racing',
    hr: { fullName: 'Remsi', email: 'remsi@mclaren-demo.example', designation: 'HR Business Partner', phone: '+441483000001' },
  });
  return { owner, agency, ferrari, mclaren };
}

function runSeedNfs() {
  step('scripts/seed-nfs.mjs — 4 jobs × 6 applicants');
  const r = spawnSync(process.execPath, ['scripts/seed-nfs.mjs'], { stdio: 'inherit', env: process.env });
  if (r.status !== 0) throw new Error(`seed-nfs.mjs failed (exit ${r.status})`);
}

async function seedNfsPipeline(nfs) {
  step('Nfs — screening, interviews, final scores and submissions');
  const { owner, agency, ferrari, mclaren } = nfs;
  const jobs = await prisma.job.findMany({
    where: { companyId: agency.id },
    include: { applications: { include: { candidate: { include: { user: { select: { email: true } } } } } } },
  });
  const jobLike = (text) => {
    const job = jobs.find((j) => j.title.includes(text));
    if (!job) throw new Error(`Nfs job "${text}" not found — did seed-nfs.mjs change?`);
    return job;
  };
  const appOf = (job, fullName) => {
    const email = `${slugify(fullName)}@${NFS_CANDIDATE_DOMAIN}`;
    const app = job.applications.find((a) => a.candidate.user.email === email);
    if (!app) throw new Error(`${fullName} has no application on ${job.title}`);
    return app;
  };

  // Per-job settings: final-score threshold on Ferrari, instant links on Embedded.
  let fullStack = jobLike('Full Stack');
  let data = jobLike('Data Engineer');
  let embedded = jobLike('Embedded');
  const frontend = jobLike('Frontend');
  fullStack = { ...fullStack, ...(await prisma.job.update({ where: { id: fullStack.id }, data: { finalThreshold: 70 } })) };
  data = { ...data, ...(await prisma.job.update({ where: { id: data.id }, data: { finalThreshold: 70 } })) };
  embedded = { ...embedded, ...(await prisma.job.update({ where: { id: embedded.id }, data: { interviewFlow: 'INSTANT', inviteValidDays: 7 } })) };
  await prisma.aiInterviewConfig.createMany({
    data: [
      {
        jobId: fullStack.id, aiName: 'Aria', aiTitle: 'Technical Recruiter', questionCount: 6, answerTimeSeconds: 60,
        focusSkills: ['React', 'Node.js', 'WebSockets'],
        interviewInstructions: 'Probe real-time data handling and how they keep a live dashboard responsive.',
        evaluationInstructions: 'Must show production experience with real-time data. Postgres performance knowledge is a plus.',
      },
      { jobId: data.id, aiName: 'Aria', aiTitle: 'Technical Recruiter', questionCount: 6, answerTimeSeconds: 60, focusSkills: ['Kafka', 'Spark'] },
      { jobId: embedded.id, aiName: 'James', aiTitle: 'Engineering Recruiter', voiceGender: 'MALE', questionCount: 6, answerTimeSeconds: 60, focusSkills: ['C', 'RTOS', 'CAN'] },
    ],
  });

  // Recruiters: one working the Ferrari account, one view-only on a McLaren job.
  await createRecruiter(agency.id, {
    email: 'neha.kapoor@nfs-agency.example', fullName: 'Neha Kapoor',
    permissions: ['MANAGE_JOBS', 'REVIEW_CANDIDATES', 'CONFIGURE_INTERVIEWS', 'SUBMIT_CANDIDATES'],
    jobIds: [fullStack.id, data.id], clientIds: [ferrari.client.id],
  });
  await createRecruiter(agency.id, {
    email: 'rahul.verma@nfs-agency.example', fullName: 'Rahul Verma', permissions: ['VIEW_CANDIDATES'], jobIds: [frontend.id],
  });

  // Ferrari — Full Stack (slot interviews, threshold 70)
  {
    const job = fullStack;
    const fsCriteria = (realtime, pg) => [
      { criterion: 'Production experience with real-time data', verdict: realtime, evidence: realtime === 'MET' ? 'Described a WebSocket + Kafka gateway with frame-rate throttling.' : 'Only polling-based examples given.' },
      { criterion: 'PostgreSQL performance knowledge', verdict: pg, evidence: pg === 'MET' ? 'Partitioning, BRIN indexes and rollups explained clearly.' : 'Basic indexing only.' },
    ];
    const luca = appOf(job, 'Luca Bianchi');
    await screen(luca, job, luca.candidate, 88);
    await completedInterview(luca, job, luca.candidate, {
      startedAt: dayAt(-5, 10), bank: BANK_FULLSTACK, tier: 'strong', criteria: fsCriteria('MET', 'MET'),
      report: {
        overall: 86, technical: 88, communication: 83,
        strengths: ['Deep real-time data experience', 'Strong PostgreSQL design for time-series', 'Calm, structured answers'],
        areas: ['Could say more about testing strategy'],
        reasoning: 'Luca has clearly built and run real-time telemetry systems end to end. Excellent fit for the race telemetry platform.',
      },
    });
    await applyFinalScore(luca, job, 88, 86);
    await submitToHr(luca, ferrari.hr, owner.id, { note: 'Top candidate — available with 30 days notice.', sentAt: ago(3 * DAY), viewedAt: ago(2 * DAY) });

    const aarav = appOf(job, 'Aarav Shah');
    await screen(aarav, job, aarav.candidate, 82);
    await completedInterview(aarav, job, aarav.candidate, {
      startedAt: dayAt(-4, 14), bank: BANK_FULLSTACK, tier: 'medium', criteria: fsCriteria('PARTLY', 'NOT_MET'),
      report: {
        overall: 74, technical: 76, communication: 71,
        strengths: ['Good React performance knowledge', 'Solid MERN + TypeScript background'],
        areas: ['Time-series storage design', 'Reconnect / backfill strategy for live data'],
        reasoning: 'Aarav is a capable full-stack engineer with good React depth, lighter on database design for high-volume data.',
      },
    });
    await applyFinalScore(aarav, job, 82, 74);

    const sofia = appOf(job, 'Sofia Romano');
    await screen(sofia, job, sofia.candidate, 68);
    await completedInterview(sofia, job, sofia.candidate, {
      startedAt: dayAt(-3, 11), bank: BANK_FULLSTACK, tier: 'weak', criteria: fsCriteria('NOT_MET', 'NOT_MET'),
      report: {
        overall: 52, technical: 45, communication: 66,
        strengths: ['Communicates clearly', 'Good eye for UI detail'],
        areas: ['Backend and database fundamentals', 'Real-time data handling'],
        reasoning: 'Sofia is a frontend-focused developer; the role needs much more backend and real-time depth than she showed.',
      },
    });
    await applyFinalScore(sofia, job, 68, 52);

    const neha = appOf(job, 'Neha Kulkarni');
    await screen(neha, job, neha.candidate, 63);
    await scheduleSlotInterview(neha, job, dayAt(1, 15));

    const marco = appOf(job, 'Marco Conti');
    await screen(marco, job, marco.candidate, 34);
    await setStatus(marco, 'REJECTED');

    const rohan = appOf(job, 'Rohan Gupta');
    await screen(rohan, job, rohan.candidate, 41);
    await setStatus(rohan, 'SCREENING');

    await availableSlots(job, [dayAt(2, 10), dayAt(2, 11), dayAt(3, 16)]);
    console.log('  Ferrari Full Stack:  Luca SUBMITTED (viewed) · Aarav QUALIFIED · Sofia NOT_QUALIFIED · Neha interview booked · Marco REJECTED · Rohan awaiting decision');
  }

  // Ferrari — Data Engineer (slot interviews, threshold 70)
  {
    const job = data;
    const giulia = appOf(job, 'Giulia Ferraro');
    await screen(giulia, job, giulia.candidate, 90);
    await inProgressInterview(giulia, job, giulia.candidate, BANK_DATA);

    const vikram = appOf(job, 'Vikram Rao');
    await screen(vikram, job, vikram.candidate, 84);
    await scheduleSlotInterview(vikram, job, dayAt(2, 12));

    const elena = appOf(job, 'Elena Russo');
    await screen(elena, job, elena.candidate, 61);
    await cancelledSlotInterview(elena, job, dayAt(-1, 15));

    const arjun = appOf(job, 'Arjun Menon');
    await screen(arjun, job, arjun.candidate, 58);
    await setStatus(arjun, 'SHORTLISTED');

    await availableSlots(job, [dayAt(3, 10), dayAt(3, 11)]);
    console.log('  Ferrari Data Eng.:   Giulia interview IN PROGRESS · Vikram interview booked · Elena interview cancelled · Arjun shortlisted · Pooja/Daniel not screened');
  }

  // McLaren — Embedded (instant interview links, no threshold)
  {
    const job = embedded;
    const oliver = appOf(job, 'Oliver Hughes');
    await screen(oliver, job, oliver.candidate, 87);
    const oliverLink = await instantInvite(oliver, job, { sentAt: ago(DAY) });

    const sid = appOf(job, 'Siddharth Iyer');
    await screen(sid, job, sid.candidate, 80);
    await completedInterview(sid, job, sid.candidate, {
      startedAt: dayAt(-3, 17), bank: BANK_EMBEDDED, tier: 'strong', slot: false,
      report: {
        overall: 79, technical: 81, communication: 76,
        strengths: ['Strong RTOS fundamentals', 'Practical CAN experience', 'Methodical debugging'],
        areas: ['Less exposure to formal ISO 26262 processes'],
        reasoning: 'Siddharth has hands-on embedded C and RTOS depth from EV and drone work; safety-process experience would need support.',
      },
    });
    await applyFinalScore(sid, job, 80, 79);
    await submitToHr(sid, mclaren.hr, owner.id, { sentAt: ago(DAY) });

    // Round 1 hit connection problems; Company HR asked for a second round.
    const emily = appOf(job, 'Emily Clarke');
    await screen(emily, job, emily.candidate, 66);
    await completedInterview(emily, job, emily.candidate, {
      startedAt: dayAt(-6, 11), bank: BANK_EMBEDDED, tier: 'medium', slot: false,
      extraEvents: [{ type: 'CONNECTION_LOST', atMin: 6 }, { type: 'CONNECTION_RESTORED', atMin: 7 }, { type: 'CONNECTION_LOST', atMin: 10 }, { type: 'CONNECTION_RESTORED', atMin: 11 }],
      report: {
        overall: 58, technical: 55, communication: 63,
        strengths: ['Good IoT firmware background', 'Honest about gaps'],
        areas: ['RTOS scheduling concepts', 'Answers were cut short by connection drops'],
        reasoning: 'Mixed result, partly affected by two connection drops during the technical section.',
      },
    });
    await applyFinalScore(emily, job, 66, 58);
    await submitToHr(emily, mclaren.hr, owner.id, { sentAt: ago(5 * DAY), viewedAt: ago(4 * DAY) });
    const emilyLink = await instantInvite(emily, job, {
      sentAt: ago(3 * DAY),
      keepStatus: true, // stays "Submitted to company"
      round: {
        round: 2,
        roundReason: 'TECHNICAL_ISSUE',
        roundNotes: 'Connection dropped twice during the technical section — please re-run the RTOS questions.',
        roundRequestedById: mclaren.hrUser.id,
        roundRequestedByRole: 'CLIENT_HR',
      },
    });

    const thomas = appOf(job, 'Thomas Wright');
    await screen(thomas, job, thomas.candidate, 55);
    await setStatus(thomas, 'SCREENING');
    for (const name of ['Harsh Vora', 'Ananya Das']) {
      const a = appOf(job, name);
      await screen(a, job, a.candidate, name === 'Harsh Vora' ? 38 : 29);
      await setStatus(a, 'REJECTED');
    }
    console.log('  McLaren Embedded:    Oliver invite pending · Siddharth SUBMITTED · Emily SUBMITTED + round 2 pending · Thomas awaiting decision · Harsh/Ananya REJECTED');
    console.log(`    Oliver's interview link (local): ${oliverLink}`);
    console.log(`    Emily's round-2 link (local):    ${emilyLink}`);
  }
  console.log('  McLaren Frontend:    all 6 APPLIED — run AI screening live');

  // A draft and a closed job so the job list isn't all OPEN.
  await prisma.job.createMany({
    data: [
      {
        companyId: agency.id, createdBy: owner.id, status: 'DRAFT', title: 'QA Automation Engineer – Pit Wall Tools',
        description: 'Automate testing for the pit-wall strategy tools (Playwright, TypeScript).', requiredSkills: ['Playwright', 'TypeScript'],
        location: 'Maranello', clientCompanyId: ferrari.client.id, departmentId: ferrari.dept.id, hiringPersonId: ferrari.hr.id,
      },
      {
        companyId: agency.id, createdBy: owner.id, status: 'CLOSED', title: 'Race Strategy Analyst (filled)',
        description: 'Race strategy modelling and simulation.', requiredSkills: ['Python', 'Statistics'],
        location: 'Woking', clientCompanyId: mclaren.client.id, departmentId: mclaren.dept.id, hiringPersonId: mclaren.hr.id,
        createdAt: ago(40 * DAY),
      },
    ],
  });
}

async function seedSuspendedAgency(adminId) {
  step('Suspended agency (Portal Admin view)');
  const { owner, agency } = await createAgency({
    email: 'owner@stellarstaffing.example',
    name: 'Stellar Staffing Solutions',
    ownerName: 'Karan Mehta',
    status: 'SUSPENDED',
    createdByAdminId: adminId,
    industry: 'Staffing',
    location: 'Bengaluru, India',
  });
  await prisma.job.create({
    data: {
      companyId: agency.id, createdBy: owner.id, status: 'CLOSED', title: 'Sales Executive',
      description: 'Field sales for B2B SaaS.', requiredSkills: ['Sales', 'Negotiation'], location: 'Bengaluru', createdAt: ago(60 * DAY),
    },
  });
}

// Ravantra (prisma/seed.js) — the three interviewed candidates come from
// seed-demo-interviews.js; this fills in everyone else.
async function seedRavantraPipeline() {
  step('Ravantra Technologies — React.js Developer pipeline');
  const job = await prisma.job.findFirst({
    where: { title: 'React.js Developer', company: { user: { email: 'company@ravantratech.demo' } } },
    include: { applications: { include: { candidate: { include: { user: { select: { email: true } } } }, screeningResult: true, interviews: { include: { report: true } } } } },
  });
  if (!job) throw new Error('Ravantra React.js Developer job not found — run "npm run db:seed" first.');
  const appOf = (email) => {
    const app = job.applications.find((a) => a.candidate.user.email === email);
    if (!app) throw new Error(`${email} has no application — run "npm run db:seed" first.`);
    return app;
  };

  // Final scores for the interviewed three (no threshold on this job, so status stays).
  for (const app of job.applications) {
    const report = app.interviews.find((i) => i.status === 'COMPLETED')?.report;
    if (report?.overallScore != null && app.screeningResult?.overallScore != null) {
      await applyFinalScore(app, job, app.screeningResult.overallScore, report.overallScore);
    }
  }

  const others = ['kavya.nair', 'ananya.iyer', 'ishaan.kapoor', 'karan.desai', 'sneha.verma', 'meera.pillai', 'divya.joshi'].map((n) => appOf(`${n}@example.com`));
  // Re-runnable: clear this script's earlier states on those applications and the job's spare slots.
  const ids = others.map((a) => a.id);
  const slotIds = (await prisma.interview.findMany({ where: { applicationId: { in: ids } }, select: { slotId: true } })).map((i) => i.slotId).filter(Boolean);
  await prisma.interview.deleteMany({ where: { applicationId: { in: ids } } });
  await prisma.interviewSlot.deleteMany({ where: { OR: [{ id: { in: slotIds } }, { jobId: job.id, status: 'AVAILABLE' }] } });
  await prisma.screeningResult.deleteMany({ where: { applicationId: { in: ids } } });
  await prisma.application.updateMany({ where: { id: { in: ids } }, data: { status: 'APPLIED' } });

  const [kavya, ananya, ishaan, karan, sneha, meera] = others;
  await screen(kavya, job, kavya.candidate, 76);
  await scheduleSlotInterview(kavya, job, dayAt(1, 11));
  await screen(ananya, job, ananya.candidate, 71);
  await setStatus(ananya, 'SHORTLISTED');
  await screen(ishaan, job, ishaan.candidate, 66);
  await cancelledSlotInterview(ishaan, job, dayAt(-1, 16));
  await screen(karan, job, karan.candidate, 54);
  await setStatus(karan, 'SCREENING');
  await screen(sneha, job, sneha.candidate, 18);
  await setStatus(sneha, 'REJECTED');
  await screen(meera, job, meera.candidate, 29);
  await setStatus(meera, 'REJECTED');
  await availableSlots(job, [dayAt(2, 10), dayAt(2, 11), dayAt(3, 10), dayAt(4, 14)]);
  console.log('  Ridham/Riya/Priya interviewed (final scores set) · Kavya interview booked · Ananya shortlisted · Ishaan interview cancelled');
  console.log('  Karan awaiting decision · Sneha/Meera REJECTED · Divya not screened · 4 open slots');
}

async function main() {
  assertLocalDatabase();
  await wipeOwnData();
  const admin = await seedAdmins();
  const localAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN', email: { not: acct.admin.email } }, orderBy: { createdAt: 'asc' } });
  await seedDemoAgency();
  const nfs = await seedNfsAgency((localAdmin ?? admin).id);
  runSeedNfs();
  await seedNfsPipeline(nfs);
  await seedSuspendedAgency((localAdmin ?? admin).id);
  await seedRavantraPipeline();
  console.log(`\nDone. Password for every seeded account: ${PASSWORD}  (see login.md)`);
}

main()
  .catch((err) => {
    console.error('\nSEED FAILED:', err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
