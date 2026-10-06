import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../../../config/env';

// Sends through any SMTP server (EMAIL_SMTP_HOST / PORT / USER / PASS,
// sender EMAIL_FROM). Throws on failure; the caller (email.service.ts) is
// responsible for catching it, logging to EmailLog, and never letting an
// email failure break the request that triggered it.

let transporter: Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!env.smtp.host) throw new Error('EMAIL_SMTP_HOST is not configured');
  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
  });
  return transporter;
}

// EMAIL_FROM may already be "Name <address>"; a bare address gets the
// configured display name.
function fromAddress() {
  if (!env.emailFrom) throw new Error('EMAIL_FROM is not configured');
  return env.emailFrom.includes('<') ? env.emailFrom : { name: env.emailFromName, address: env.emailFrom };
}

export async function send({ to, subject, html }) {
  const info = await getTransporter().sendMail({ from: fromAddress(), to, subject, html });
  // sendMail resolves even when the server refused the recipient — treat that
  // as a failure so EmailLog says FAILED instead of SENT.
  if (info.rejected?.length) {
    throw new Error(`SMTP server rejected ${info.rejected.join(', ')}: ${info.response}`);
  }
  // The server's reply (e.g. "250 OK id=…") is the message id to look up in
  // the SMTP provider's activity log when an email doesn't arrive.
  // (No subject here: the OTP email carries its code in the subject.)
  console.log(`[email:smtp] accepted for ${to} — ${info.response}`);
}
