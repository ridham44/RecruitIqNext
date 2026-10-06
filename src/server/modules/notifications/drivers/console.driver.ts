// Fallback driver used when no email provider is configured (or
// EMAIL_PROVIDER=console) — logs instead of sending, so local development
// and demos work without an email provider set up (see index.ts).
export async function send({ to, subject }) {
  console.log(`[email:console] Would send to ${to} — "${subject}" (EMAIL_PROVIDER=console)`);
}
