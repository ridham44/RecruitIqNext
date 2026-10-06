import bcrypt from 'bcryptjs';
import { prisma, TX_OPTIONS } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { ROLES } from '../../../shared/constants/roles';
import { signToken } from './token.util';
// import { findUsableToken } from './passwordToken.service';
import { findUsableToken, issuePasswordToken } from './passwordToken.service';
import { sendPasswordResetEmail } from '../notifications/email.service';

const SALT_ROUNDS = 10;

// function serializeUser(user) {
//   return {
//     id: user.id,
//     email: user.email,
//     role: user.role,
//     company: user.company || undefined,
//     candidate: user.candidate || undefined,
//   };
// }
// Build plan P2: adds `membership` (role + permissions inside the company)
// for owners and recruiters; a recruiter's `company` comes via membership.
function serializeUser(user) {
  const membership = user.membership;
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    company: user.company || membership?.company || undefined,
    candidate: user.candidate || undefined,
    membership: membership
      ? { id: membership.id, role: membership.role, permissions: membership.permissions, fullName: membership.fullName }
      : undefined,
    // Build plan P8: who a CLIENT_HR user is inside their client company.
    hiringPerson: user.hiringPerson
      ? {
          id: user.hiringPerson.id,
          fullName: user.hiringPerson.fullName,
          // department: user.hiringPerson.department?.name,
          // clientName: user.hiringPerson.department?.clientCompany?.name,
          // recruitmentCompany: user.hiringPerson.department?.clientCompany?.company?.name,
          department: user.hiringPerson.department?.name || null,
          clientName: user.hiringPerson.clientCompany?.name,
          recruitmentCompany: user.hiringPerson.clientCompany?.company?.name,
        }
      : undefined,
  };
}

// Relations every auth response needs (login, /auth/me, set-password).
// export const USER_AUTH_INCLUDE = { company: true, candidate: true, membership: { include: { company: true } } };
export const USER_AUTH_INCLUDE = {
  company: true,
  candidate: true,
  membership: { include: { company: true } },
  // Build plan P8
  // hiringPerson: { include: { department: { include: { clientCompany: { include: { company: true } } } } } },
  // HR belongs to the client company directly; department optional.
  hiringPerson: { include: { department: true, clientCompany: { include: { company: true } } } },
};

export async function registerCompany({ email, password, companyName, website, industry, location }) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) throw ApiError.conflict('An account with this email already exists', 'EMAIL_TAKEN');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // const user = await prisma.user.create({
  //   data: {
  //     email: normalizedEmail,
  //     passwordHash,
  //     role: ROLES.COMPANY,
  //     company: {
  //       create: { name: companyName, website: website || null, industry: industry || null, location: location || null },
  //     },
  //   },
  //   include: { company: true },
  // });
  // Build plan P2: the owner also gets an OWNER CompanyMember row, in the
  // same transaction as the user + company.
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role: ROLES.COMPANY,
        company: {
          create: { name: companyName, website: website || null, industry: industry || null, location: location || null },
        },
      },
      include: { company: true },
    });
    await tx.companyMember.create({ data: { companyId: created.company.id, userId: created.id, role: 'OWNER' } });
    return created;
  }, TX_OPTIONS);

  return { user: serializeUser(user), token: signToken(user) };
}

// Candidates have no RecruitIQ login: they apply through an agency's /recq
// link, verify with an email code, and get the interview link and every
// status update by email (with a personal no-login status link).
export const CANDIDATE_NO_LOGIN_MESSAGE =
  "Candidates don't sign in to RecruitIQ. Your verification code, interview link and status updates all come to your email.";
export const candidateNoLogin = () => ApiError.forbidden(CANDIDATE_NO_LOGIN_MESSAGE, 'CANDIDATE_NO_LOGIN');

export async function registerCandidate(_input?: unknown): Promise<never> {
  throw candidateNoLogin();
}

export async function login({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    // include: { company: true, candidate: true },
    include: USER_AUTH_INCLUDE,
  });

  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }

  // Build plan P1: checked only after the password matches, so a wrong
  // password never reveals whether a company is suspended (or that the
  // email belongs to a candidate).
  if (user.role === ROLES.CANDIDATE) throw candidateNoLogin();
  assertCompanyNotSuspended(user);

  return { user: serializeUser(user), token: signToken(user) };
}

export function assertCompanyNotSuspended(user) {
  // Build plan P8: a deactivated HR person can't log in; a suspended
  // recruitment company closes its clients' portal too.
  if (user.role === ROLES.CLIENT_HR) {
    if (!user.hiringPerson?.isActive) throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    // if (user.hiringPerson.department?.clientCompany?.company?.status === 'SUSPENDED') {
    if (user.hiringPerson.clientCompany?.company?.status === 'SUSPENDED') {
      throw ApiError.forbidden('This portal is currently unavailable. Please contact your recruitment agency.', 'COMPANY_SUSPENDED');
    }
    return;
  }
  // Build plan P2: a deactivated recruiter is treated like a wrong login.
  if (user.role === ROLES.RECRUITER && user.membership && !user.membership.isActive) {
    throw ApiError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
  }
  const companyStatus = user.role === ROLES.RECRUITER ? user.membership?.company?.status : user.company?.status;
  // if (user.role === ROLES.COMPANY && user.company?.status === 'SUSPENDED') {
  if ((user.role === ROLES.COMPANY || user.role === ROLES.RECRUITER) && companyStatus === 'SUSPENDED') {
    throw ApiError.forbidden(
      'Your agency account has been suspended. Please contact the RecruitIQ administrator.',
      'COMPANY_SUSPENDED'
    );
  }
}

// Forgot password. Always resolves the same way whether or not the email
// exists, so the endpoint can't be used to discover accounts. At most 3
// reset emails per account per 15 minutes; extra requests are silently
// ignored.
const RESET_TTL_HOURS = 1;
const RESET_LIMIT = { count: 3, windowMs: 15 * 60 * 1000 };

export async function requestPasswordReset({ email }) {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() }, include: USER_AUTH_INCLUDE });
  // Candidates have no password to reset.
  if (!user || !user.isActive || user.role === ROLES.CANDIDATE) return;
  try {
    assertCompanyNotSuspended(user);
  } catch {
    return;
  }

  const recent = await prisma.passwordToken.count({
    where: { userId: user.id, purpose: 'RESET', createdAt: { gt: new Date(Date.now() - RESET_LIMIT.windowMs) } },
  });
  if (recent >= RESET_LIMIT.count) return;

  const { link } = await issuePasswordToken(user.id, { purpose: 'RESET', ttlHours: RESET_TTL_HOURS });
  await sendPasswordResetEmail({ to: user.email, link, expiresInMinutes: RESET_TTL_HOURS * 60 });
}

// Build plan P1: lets the set-password page greet the user and show which
// account the link is for before they choose a password.
export async function getPasswordTokenInfo(token) {
  const row = await findUsableToken(token);
  // Set-password links sent to candidates before logins were removed.
  if (row.user.role === ROLES.CANDIDATE) throw candidateNoLogin();
  return {
    email: row.user.email,
    role: row.user.role,
    // companyName: row.user.company?.name,
    // companyName: row.user.company?.name ?? row.user.membership?.company?.name,
    // Build plan P8: client HR see their own (client) company name.
    // companyName: row.user.company?.name ?? row.user.membership?.company?.name ?? row.user.hiringPerson?.department?.clientCompany?.name,
    companyName: row.user.company?.name ?? row.user.membership?.company?.name ?? row.user.hiringPerson?.clientCompany?.name,
    purpose: row.purpose,
  };
}

// Build plan P1: consumes an invite link, sets the password and logs the
// user straight in. The usedAt IS NULL condition makes the link single-use
// even if it's submitted twice at the same moment.
export async function setPasswordWithToken({ token, password }) {
  const row = await findUsableToken(token);
  if (row.user.role === ROLES.CANDIDATE) throw candidateNoLogin();
  if (!row.user.isActive) throw ApiError.forbidden('This account is inactive', 'ACCOUNT_INACTIVE');
  assertCompanyNotSuspended(row.user);

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const consumed = await prisma.$transaction(async (tx) => {
    const { count } = await tx.passwordToken.updateMany({
      where: { id: row.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (count === 0) return false;
    // await tx.user.update({ where: { id: row.userId }, data: { passwordHash } });
    // Build plan P4: guest candidates become full accounts here.
    await tx.user.update({ where: { id: row.userId }, data: { passwordHash, passwordSet: true } });
    return true;
  }, TX_OPTIONS);
  if (!consumed) throw ApiError.badRequest('This link has already been used. Please log in.', 'TOKEN_USED');

  return { user: serializeUser(row.user), token: signToken(row.user) };
}

export async function getCurrentUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    // include: { company: true, candidate: true },
    include: USER_AUTH_INCLUDE,
  });
  if (!user) throw ApiError.notFound('User not found');
  return serializeUser(user);
}
