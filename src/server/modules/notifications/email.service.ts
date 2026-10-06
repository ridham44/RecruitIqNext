import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { emailDriver } from './drivers/index';
import { applicationTrackUrl } from '../public/trackToken';

function layout(bodyHtml) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
            <tr>
              <td style="background:#2a4bd6;padding:20px 24px;">
                <span style="color:#ffffff;font-size:18px;font-weight:bold;">RecruitIQ</span>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;color:#0f172a;font-size:14px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// The candidate's personal status link (no login needed). Candidates have no
// RecruitIQ account, so every candidate email carries it. Optional button
// label turns it into the main call to action (e.g. booking a slot).
function statusLinkBlock(applicationId, buttonLabel?: string, intro?: string) {
  if (!applicationId) return '';
  const url = applicationTrackUrl(applicationId);
  if (buttonLabel) {
    return `${intro ? `<p>${intro}</p>` : ''}<p style="margin:24px 0;">
    <a href="${url}" style="background:#2a4bd6;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:bold;display:inline-block;">
      ${buttonLabel}
    </a>
  </p>
  <p style="color:#64748b;font-size:12px;">No login needed — this link is personal to you. If the button doesn't work, copy this link: ${url}</p>`;
  }
  return `<p style="color:#475569;font-size:13px;">Check your progress any time, no login needed: <a href="${url}">your application status</a></p>`;
}

// Every send attempt — success or failure — is written to EmailLog, so
// failures are visible/debuggable instead of silently disappearing. Never
// throws: a broken email provider must never fail the request (bulk
// status update, screening, booking) that triggered the notification.
async function sendAndLog({ to, subject, html, type, applicationId }) {
  try {
    await emailDriver.send({ to, subject, html });
    await prisma.emailLog.create({
      data: { applicationId, recipientEmail: to, type, subject, status: 'SENT' },
    });
  } catch (err) {
    console.error(`[email] Failed to send "${subject}" to ${to}:`, err.message);
    await prisma.emailLog
      .create({
        data: { applicationId, recipientEmail: to, type, subject, status: 'FAILED', errorMessage: err.message },
      })
      .catch(() => {});
  }
}

// application must include candidate.user, job, job.company.
export async function sendApplicationStatusEmail(application) {
  const to = application.candidate.user.email;
  const candidateName = application.candidate.fullName;
  const jobTitle = application.job.title;
  const companyName = application.job.company.name;

  if (application.status === 'SHORTLISTED') {
    const subject = `You've been shortlisted for ${jobTitle} at ${companyName}`;
    // Instant-link jobs email the interview link separately; slot jobs book from the status link.
    const instant = application.job.interviewFlow === 'INSTANT';
    const html = layout(`
      <p>Hi ${esc(candidateName)},</p>
      <p>Good news — <strong>${esc(companyName)}</strong> has shortlisted your application for
      <strong>${esc(jobTitle)}</strong> and would like to move forward to the next stage.</p>
      ${
        instant
          ? `<p>Your interview link is on its way in a separate email.</p>${statusLinkBlock(application.id)}`
          : statusLinkBlock(application.id, 'Book your interview time', 'Pick a time for your interview — no login needed:')
      }
      <p>— The RecruitIQ team</p>
    `);
    return sendAndLog({ to, subject, html, type: 'APPLICATION_SHORTLISTED', applicationId: application.id });
  }

  if (application.status === 'REJECTED') {
    const subject = `Update on your application for ${jobTitle}`;
    const html = layout(`
      <p>Hi ${esc(candidateName)},</p>
      <p>Thank you for applying for <strong>${esc(jobTitle)}</strong> at <strong>${esc(companyName)}</strong>.
      After careful review, the status of your application has changed and the company will not be
      moving forward with it at this time.</p>
      <p>We appreciate the time you invested in your application and encourage you to apply to other
      roles that match your background.</p>
      ${statusLinkBlock(application.id)}
      <p>— The RecruitIQ team</p>
    `);
    return sendAndLog({ to, subject, html, type: 'APPLICATION_REJECTED', applicationId: application.id });
  }
}

// Build plan P1: invite for an account someone else created (admin-onboarded
// company owner). Not tied to an application, so applicationId stays null.
// Build plan P2: `asRecruiter` switches the wording for recruiter invites.
// Build plan P8: `asClientHr` (+ partnerName) for client HR portal invites.
export async function sendAccountSetupEmail({
  to,
  companyName: rawCompanyName,
  link,
  expiresInHours = 72,
  asRecruiter = false,
  asClientHr = false,
  partnerName,
}: {
  to: string;
  companyName: string;
  link: string;
  expiresInHours?: number;
  asRecruiter?: boolean;
  asClientHr?: boolean;
  partnerName?: string;
}) {
  // const subject = `Set up your RecruitIQ account for ${rawCompanyName}`;
  const subject = asClientHr
    ? `${partnerName || 'Your recruitment agency'} invited you to the Company HR portal on RecruitIQ`
    : asRecruiter
      ? `You've been invited to join ${rawCompanyName} on RecruitIQ as an agency recruiter`
      : `Set up your RecruitIQ agency account for ${rawCompanyName}`;
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const companyName = esc(rawCompanyName);
  const intro = asClientHr
    ? `<p><strong>${esc(partnerName)}</strong> uses RecruitIQ to send you candidates for <strong>${companyName}</strong>.
    Choose a password to open the Company HR portal and see every candidate shared with you — CVs, scores and interview evaluations — in one place.</p>`
    : asRecruiter
      ? `<p><strong>${companyName}</strong> has invited you to join their agency on RecruitIQ as an agency recruiter.
    Choose a password to start working on your assigned jobs.</p>`
      : `<p>A RecruitIQ agency account has been created for <strong>${companyName}</strong>, with this email address as the agency owner.
    Choose a password to start posting jobs and screening candidates.</p>`;
  const html = layout(`
    <p>Hello,</p>
    ${intro}
    <p style="margin:24px 0;">
      <a href="${link}" style="background:#2a4bd6;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:bold;display:inline-block;">
        Set your password
      </a>
    </p>
    <p style="color:#64748b;font-size:12px;">This link works once and expires in ${expiresInHours} hours.
    If the button doesn't work, copy this link: ${link}</p>
    <p>— The RecruitIQ team</p>
  `);
  return sendAndLog({ to, subject, html, type: 'ACCOUNT_SETUP', applicationId: null });
}

// Build plan P5: instant interview link — attend now or any time before it expires.
// secondRound: a second-round AI interview (retake) — different wording.
// export async function sendInterviewInviteEmail({ to, candidateName, jobTitle, companyName, link, expiresAt, applicationId }) {
export async function sendInterviewInviteEmail({ to, candidateName, jobTitle, companyName, link, expiresAt, applicationId, secondRound = false }) {
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const until = expiresAt
    ? new Date(expiresAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : null;
  // const subject = `Your interview for ${jobTitle} at ${companyName}`;
  const subject = secondRound
    ? `Your second interview for ${jobTitle} at ${companyName}`
    : `Your interview for ${jobTitle} at ${companyName}`;
  const intro = secondRound
    ? `<p>Thank you for your first interview for <strong>${esc(jobTitle)}</strong> at <strong>${esc(companyName)}</strong>.
    We'd like you to take a <strong>second AI interview</strong> — it's ready whenever you are, no booking needed.</p>`
    : `<p>Good news — you've been shortlisted for <strong>${esc(jobTitle)}</strong> at <strong>${esc(companyName)}</strong>.
    Your AI video interview is ready whenever you are — no booking needed.</p>`;
  const html = layout(`
    <p>Hi ${esc(candidateName)},</p>
    ${intro}
    <p style="margin:24px 0;">
      <a href="${link}" style="background:#2a4bd6;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:bold;display:inline-block;">
        Start your interview
      </a>
    </p>
    <p>Before you start: use a quiet room, a working camera and microphone, and allow about 20–30 minutes.
    If you get disconnected, open the same link again to continue.</p>
    <p style="color:#64748b;font-size:12px;">${until ? `This link works until ${until}. ` : ''}Keep it private — it opens your interview.
    If the button doesn't work, copy this link: ${link}</p>
    ${statusLinkBlock(applicationId)}
    <p>— The RecruitIQ team</p>
  `);
  return sendAndLog({ to, subject, html, type: 'INTERVIEW_INVITE', applicationId: applicationId ?? null });
}

// Company HR asked for a second-round interview — tell the agency. The new
// interview link has already gone to the candidate.
export async function sendSecondRoundRequestedEmail({ to, hrName, companyName, candidateName, jobTitle, reason, notes, jobId, candidateId, applicationId }) {
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const url = `${env.publicAppUrl}/company/jobs/${jobId}/candidates/${candidateId}`;
  const subject = `2nd round requested: ${candidateName} — ${jobTitle}`;
  const html = layout(`
    <p>Hello,</p>
    <p><strong>${esc(hrName)}</strong> (${esc(companyName)}) asked for a <strong>second-round AI interview</strong> for
    <strong>${esc(candidateName)}</strong> — ${esc(jobTitle)}.</p>
    <p style="background:#f1f5f9;border-radius:8px;padding:12px 16px;margin:16px 0;">
      <strong>Reason:</strong> ${esc(reason)}${notes ? `<br /><strong>Notes:</strong> ${esc(notes)}` : ''}
    </p>
    <p>The interview link has already been emailed to the candidate. You'll see the round 2 report on the candidate's page when it's done.</p>
    <p style="margin:24px 0;">
      <a href="${url}" style="background:#2a4bd6;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:bold;display:inline-block;">
        Open candidate
      </a>
    </p>
    <p>— The RecruitIQ team</p>
  `);
  return sendAndLog({ to, subject, html, type: 'SECOND_ROUND_REQUESTED', applicationId: applicationId ?? null });
}

// Build plan P7 (§13): candidate package for a client HR / hiring person.
export async function sendClientSubmissionEmail({ to, recipientName, candidateName, jobTitle, recruitmentCompany, finalScore, note, link, applicationId }) {
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const subject = `Candidate for ${jobTitle}: ${candidateName}`;
  const html = layout(`
    <p>Hi ${esc(recipientName)},</p>
    <p><strong>${esc(recruitmentCompany)}</strong> has shared a candidate with you for <strong>${esc(jobTitle)}</strong>:
    <strong>${esc(candidateName)}</strong>${finalScore != null ? ` — overall score <strong>${Math.round(finalScore)}/100</strong>` : ''}.</p>
    ${note ? `<p style="background:#f1f5f9;border-radius:8px;padding:12px 16px;margin:16px 0;">${esc(note)}</p>` : ''}
    <p>The profile includes the CV, contact details, the AI CV match and the interview evaluation.</p>
    <p style="margin:24px 0;">
      <a href="${link}" style="background:#2a4bd6;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:bold;display:inline-block;">
        View candidate
      </a>
    </p>
    <p style="color:#64748b;font-size:12px;">This link is private to you — please don't forward it. If the button doesn't work, copy this link: ${link}</p>
    <p>— The RecruitIQ team</p>
  `);
  return sendAndLog({ to, subject, html, type: 'CLIENT_SUBMISSION', applicationId: applicationId ?? null });
}

// Forgot password: one-time reset link (see auth.service requestPasswordReset).
export async function sendPasswordResetEmail({ to, link, expiresInMinutes = 60 }) {
  const subject = 'Reset your RecruitIQ password';
  const html = layout(`
    <p>Hello,</p>
    <p>We received a request to reset the password for your RecruitIQ account (${to}).</p>
    <p style="margin:24px 0;">
      <a href="${link}" style="background:#2a4bd6;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:bold;display:inline-block;">
        Reset password
      </a>
    </p>
    <p style="color:#64748b;font-size:12px;">This link works once and expires in ${expiresInMinutes} minutes.
    If the button doesn't work, copy this link: ${link}</p>
    <p>If you didn't ask for this, you can ignore this email — your password stays the same.</p>
    <p>— The RecruitIQ team</p>
  `);
  return sendAndLog({ to, subject, html, type: 'ACCOUNT_SETUP', applicationId: null });
}

// Build plan P4: sent after a careers-portal apply. Candidates have no login:
// the personal status link (trackUrl) is how they follow the application,
// and every later step is emailed too.
export async function sendCandidateApplicationReceivedEmail({ to, fullName, companyName, jobTitle, trackUrl }) {
  const what = jobTitle ? `your application for <strong>${esc(jobTitle)}</strong>` : 'your CV';
  const subject = jobTitle ? `We received your application for ${jobTitle}` : `We received your CV — ${companyName}`;
  const html = layout(`
    <p>Hi ${esc(fullName)},</p>
    <p>Thanks — <strong>${esc(companyName)}</strong> has received ${what}. Our AI is reviewing it now.</p>
    ${
      trackUrl
        ? `<p style="margin:24px 0;">
      <a href="${trackUrl}" style="background:#2a4bd6;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:bold;display:inline-block;">
        Check your application status
      </a>
    </p>
    <p style="color:#64748b;font-size:12px;">No login needed — this link is personal to you. If the button doesn't work, copy this link: ${trackUrl}</p>`
        : ''
    }
    <p>We'll email you at every step, including your interview link and any status change.</p>
    <p>— The RecruitIQ team</p>
  `);
  return sendAndLog({ to, subject, html, type: 'ACCOUNT_SETUP', applicationId: null });
}

// application/interview/slot as returned by scheduling.service.js's bookSlot.
// joinLink (optional): the no-login interview link, for slots booked from the
// candidate's status link.
// export async function sendInterviewConfirmationEmail({ application, slot }) {
export async function sendInterviewConfirmationEmail({ application, slot, joinLink = null }) {
  const to = application.candidate.user.email;
  const candidateName = application.candidate.fullName;
  const jobTitle = application.job.title;
  const companyName = application.job.company.name;

  const dateLabel = new Date(slot.startTime).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeLabel = `${new Date(slot.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} – ${new Date(
    slot.endTime
  ).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;

  const subject = `Interview scheduled: ${jobTitle} at ${companyName}`;
  const html = layout(`
    <p>Hi ${candidateName},</p>
    <p>Your interview for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> is confirmed.</p>
    <p style="background:#f1f5f9;border-radius:8px;padding:12px 16px;margin:16px 0;">
      <strong>Date:</strong> ${dateLabel}<br />
      <strong>Time:</strong> ${timeLabel}
    </p>
    ${
      joinLink
        ? `<p style="margin:24px 0;">
      <a href="${joinLink}" style="background:#2a4bd6;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:bold;display:inline-block;">
        Join interview
      </a>
    </p>
    <p style="color:#64748b;font-size:12px;">Open this at your interview time. Use a quiet room, a working camera and microphone.
    Keep the link private — it opens your interview. If the button doesn't work, copy this link: ${joinLink}</p>
    ${statusLinkBlock(application.id)}`
        : statusLinkBlock(application.id, 'View your interview details', 'Your join link and any changes are on your personal status page — no login needed:')
    }
    <p>— The RecruitIQ team</p>
  `);
  return sendAndLog({ to, subject, html, type: 'INTERVIEW_CONFIRMATION', applicationId: application.id });
}

// ─────────────────────────────────────────────────────────────
// Build plan P9 (/recq flow)
// ─────────────────────────────────────────────────────────────

// §12/§17: the email verification code. Sent ONLY to the address extracted
// from the uploaded resume (emailOtp.service.ts). The code is never logged in
// production and never returned in an API response.
export async function sendRecqOtpEmail({ to, code, agencyName, jobTitle }: { to: string; code: string; agencyName?: string; jobTitle?: string }) {
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const context = jobTitle
    ? `your application for <strong>${esc(jobTitle)}</strong>${agencyName ? ` at <strong>${esc(agencyName)}</strong>` : ''}`
    : agencyName
      ? `your application at <strong>${esc(agencyName)}</strong>`
      : 'your application';
  const subject = `Your RecruitIQ verification code is ${code}`;
  const html = layout(`
    <p>Hi,</p>
    <p>Use this code to verify your email and continue ${context}:</p>
    <p style="text-align:center;margin:24px 0;">
      <span style="display:inline-block;font-size:30px;letter-spacing:8px;font-weight:bold;color:#0f172a;background:#f1f5f9;border-radius:10px;padding:14px 22px;">${esc(code)}</span>
    </p>
    <p style="color:#64748b;font-size:12px;">This code expires in 5 minutes. If you didn't request it, you can ignore this email.</p>
    <p>— The RecruitIQ team</p>
  `);
  return sendAndLog({ to, subject, html, type: 'OTP_VERIFICATION', applicationId: null });
}

// §6/§18: interview access after email verification. Reuses the INTERVIEW_INVITE
// email type/log. `windowStart`/`windowEnd` (optional) describe the agency's
// configured interview window; otherwise it reads like the instant invite.
export async function sendRecqInterviewAccessEmail({ to, candidateName, jobTitle, companyName, link, windowStart, windowEnd, applicationId }) {
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const fmt = (d) =>
    new Date(d).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  const subject = `Your interview for ${jobTitle} at ${companyName}`;
  const windowBlock = windowStart || windowEnd
    ? `<p style="background:#f1f5f9;border-radius:8px;padding:12px 16px;margin:16px 0;">
         <strong>Interview window</strong><br />
         ${windowStart ? `Opens: ${fmt(windowStart)}<br />` : ''}
         ${windowEnd ? `Closes: ${fmt(windowEnd)}` : ''}
       </p>`
    : '';
  const html = layout(`
    <p>Hi ${esc(candidateName)},</p>
    <p>You're verified and eligible to interview for <strong>${esc(jobTitle)}</strong> at <strong>${esc(companyName)}</strong>.</p>
    ${windowBlock}
    <p style="margin:24px 0;">
      <a href="${link}" style="background:#2a4bd6;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:bold;display:inline-block;">
        Start your interview
      </a>
    </p>
    <p>Before you start: a quiet room, a working camera and microphone, about 15–20 minutes. If you get disconnected, open the same link again to continue.</p>
    <p style="color:#64748b;font-size:12px;">Keep this link private — it opens your interview. If the button doesn't work, copy this link: ${link}</p>
    ${statusLinkBlock(applicationId)}
    <p>We'll email you again when your interview is complete and whenever your status changes.</p>
    <p>— The RecruitIQ team</p>
  `);
  return sendAndLog({ to, subject, html, type: 'INTERVIEW_INVITE', applicationId: applicationId ?? null });
}

// ─────────────────────────────────────────────────────────────
// Candidate status updates — candidates have no login, so every change the
// candidate needs to know about is emailed, with their status link.
// ─────────────────────────────────────────────────────────────

async function loadCandidateApplication(applicationId) {
  return prisma.application.findUnique({
    where: { id: applicationId },
    include: { candidate: { include: { user: { select: { email: true } } } }, job: { include: { company: { select: { name: true } } } } },
  });
}

// The AI interview has ended (or the agency marked it done). Never mentions
// scores — candidates don't see interview or final scores.
export async function sendInterviewCompletedEmail(applicationId, { round = 1 } = {}) {
  const application = await loadCandidateApplication(applicationId);
  if (!application) return;
  const { candidate, job } = application;
  const subject = `Thanks for completing your ${round > 1 ? 'second ' : ''}interview for ${job.title}`;
  const html = layout(`
    <p>Hi ${esc(candidate.fullName)},</p>
    <p>Thank you for completing your ${round > 1 ? 'second ' : ''}interview for <strong>${esc(job.title)}</strong> at
    <strong>${esc(job.company.name)}</strong>. Your interview has been submitted and the hiring team is now reviewing it.</p>
    <p>There's nothing more you need to do right now — we'll email you as soon as there's an update.</p>
    ${statusLinkBlock(application.id)}
    <p>— The RecruitIQ team</p>
  `);
  return sendAndLog({ to: candidate.user.email, subject, html, type: 'INTERVIEW_COMPLETED', applicationId: application.id });
}

// The agency cancelled the candidate's booked interview slot; they can book
// another time from their status link.
export async function sendInterviewCancelledEmail(applicationId, { startTime }: { startTime?: Date } = {}) {
  const application = await loadCandidateApplication(applicationId);
  if (!application) return;
  const { candidate, job } = application;
  const when = startTime
    ? ` on ${new Date(startTime).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
    : '';
  const subject = `Your interview for ${job.title} was cancelled — please pick a new time`;
  const html = layout(`
    <p>Hi ${esc(candidate.fullName)},</p>
    <p><strong>${esc(job.company.name)}</strong> had to cancel your interview for <strong>${esc(job.title)}</strong>${when}.
    Sorry for the inconvenience — your application is still active.</p>
    ${statusLinkBlock(application.id, 'Pick a new interview time', 'Choose another time that suits you — no login needed:')}
    <p>— The RecruitIQ team</p>
  `);
  return sendAndLog({ to: candidate.user.email, subject, html, type: 'INTERVIEW_CANCELLED', applicationId: application.id });
}
