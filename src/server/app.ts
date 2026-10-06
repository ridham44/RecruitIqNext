import { Router } from './http/router';

import authRoutes from './modules/auth/auth.routes';
import companiesRoutes from './modules/companies/companies.routes';
import candidatesRoutes from './modules/candidates/candidates.routes';
import educationRoutes from './modules/education/education.routes';
import jobsRoutes from './modules/jobs/jobs.routes';
import resumesRoutes from './modules/resumes/resumes.routes';
import applicationsRoutes from './modules/applications/applications.routes';
import screeningRoutes from './modules/screening/screening.routes';
import schedulingRoutes from './modules/scheduling/scheduling.routes';
import interviewsRoutes from './modules/interviews/interviews.routes';
import adminRoutes from './modules/admin/admin.routes';
import configRoutes from './modules/config/config.routes';
import recruitersRoutes from './modules/recruiters/recruiters.routes';
import clientsRoutes from './modules/clients/clients.routes';
import publicRoutes from './modules/public/public.routes';
import cvPoolRoutes from './modules/cvPool/cvPool.routes';
import interviewLinkRoutes from './modules/interviews/interviewLink.routes';
import submissionsRoutes, { publicSubmissionRoutes } from './modules/submissions/submissions.routes';
import clientPortalRoutes from './modules/clientPortal/clientPortal.routes';

// The whole API as one router tree, served by the Next.js Route Handler in
// src/app/api/[...path]/route.ts (which also does CORS, the 404 and the
// central error handler). Mount order matters exactly as it did under
// Express: more specific prefixes first.
export function createApp() {
  const app = new Router();

  app.get('/api/health', (req, res) => {
    res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
  });

  // Versioned API (Section 15).
  const v1 = new Router();
  v1.use('/auth', authRoutes);
  v1.use('/companies', companiesRoutes);
  v1.use('/candidates', candidatesRoutes);
  v1.use('/candidates/me/education', educationRoutes);
  v1.use('/jobs', jobsRoutes);
  v1.use('/resumes', resumesRoutes);
  v1.use('/applications', applicationsRoutes);
  v1.use('/screening', screeningRoutes);
  v1.use('/scheduling', schedulingRoutes);
  v1.use('/interviews', interviewsRoutes);
  // Build plan P1
  v1.use('/admin', adminRoutes);
  v1.use('/config', configRoutes);
  // Build plan P2
  v1.use('/recruiters', recruitersRoutes);
  // Build plan P3
  v1.use('/clients', clientsRoutes);
  // Build plan P5 — mounted before /public so it isn't caught by the
  // FEATURE_GUEST_APPLY gate (it has its own FEATURE_INSTANT_INTERVIEW gate).
  v1.use('/public/interviews', interviewLinkRoutes);
  // Build plan P7 — the HR person's read-only candidate link (always on:
  // the plan's P7 email links must work before/without the P8 portal).
  v1.use('/public/submissions', publicSubmissionRoutes);
  v1.use('/submissions', submissionsRoutes);
  // Build plan P8
  v1.use('/client-portal', clientPortalRoutes);
  // Build plan P4
  v1.use('/public', publicRoutes);
  v1.use('/cv-pool', cvPoolRoutes);

  app.use('/api/v1', v1);

  return app;
}
