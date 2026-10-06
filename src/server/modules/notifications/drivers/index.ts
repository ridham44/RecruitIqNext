import * as smtpDriver from './smtp.driver';
import * as brevoDriver from './brevo.driver';
import * as consoleDriver from './console.driver';
import { env } from '../../../config/env';

// Same seam pattern as src/server/resume/storage/index.ts: callers never
// import a driver directly, so swapping providers means adding a driver file
// and updating this map — never touching email.service.ts. The provider is
// EMAIL_PROVIDER (smtp | brevo | console); unset, it is smtp once
// EMAIL_SMTP_HOST is set, else brevo once BREVO_API_KEY is set, else console —
// so the app never crashes for lack of email configuration, it just logs.
const drivers = { smtp: smtpDriver, brevo: brevoDriver, console: consoleDriver };

const driver = drivers[env.emailProvider] || consoleDriver;

export const emailDriver = {
  send: driver.send,
};

export const emailIsConsole = driver === consoleDriver;
