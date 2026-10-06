import { Router } from '../../http/router';
import * as schedulingController from './scheduling.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { ROLES, COMPANY_SIDE_ROLES } from '../../../shared/constants/roles';
// import { PERMISSIONS } from '../../../shared/constants/permissions';
// import { requirePermission } from '../../middleware/permission';
// import { createSlotsSchema, generateSlotsSchema, bookSlotSchema } from '../../../shared/schemas/scheduling.schema';
import { PERMISSIONS, VIEW_CANDIDATE_PERMISSIONS } from '../../../shared/constants/permissions';
import { requirePermission, requireAnyPermission } from '../../middleware/permission';
import { createSlotsSchema, generateSlotsSchema, bookSlotSchema, secondRoundSchema } from '../../../shared/schemas/scheduling.schema';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok } from '../../utils/apiResponse';
import { giveSecondRound, getRoundsForCompany } from './scheduling.service';

const router = new Router();

router.use(authenticate);

// Company: manage slots for a job
// router.post('/jobs/:jobId/slots', authorize(ROLES.COMPANY), validate(createSlotsSchema), schedulingController.createSlots);
// router.post(
//   '/jobs/:jobId/slots/generate',
//   authorize(ROLES.COMPANY),
//   validate(generateSlotsSchema),
//   schedulingController.generateSlots
// );
// router.get('/jobs/:jobId/slots', authorize(ROLES.COMPANY), schedulingController.listSlotsForJob);
// router.delete('/jobs/:jobId/slots/:slotId', authorize(ROLES.COMPANY), schedulingController.cancelSlot);
// router.patch(
//   '/jobs/:jobId/interviews/:interviewId/complete',
//   authorize(ROLES.COMPANY),
//   schedulingController.markInterviewCompleted
// );
// Build plan P2: owners, and recruiters with CONFIGURE_INTERVIEWS on an assigned job.
const configureInterviews = requirePermission(PERMISSIONS.CONFIGURE_INTERVIEWS);
router.post('/jobs/:jobId/slots', authorize(...COMPANY_SIDE_ROLES), configureInterviews, validate(createSlotsSchema), schedulingController.createSlots);
router.post(
  '/jobs/:jobId/slots/generate',
  authorize(...COMPANY_SIDE_ROLES),
  configureInterviews,
  validate(generateSlotsSchema),
  schedulingController.generateSlots
);
// Viewing slots only needs job access (getOwnedJob); changing them needs CONFIGURE_INTERVIEWS.
router.get('/jobs/:jobId/slots', authorize(...COMPANY_SIDE_ROLES), schedulingController.listSlotsForJob);
router.delete('/jobs/:jobId/slots/:slotId', authorize(...COMPANY_SIDE_ROLES), configureInterviews, schedulingController.cancelSlot);
router.patch(
  '/jobs/:jobId/interviews/:interviewId/complete',
  authorize(...COMPANY_SIDE_ROLES),
  configureInterviews,
  schedulingController.markInterviewCompleted
);
// Build plan P5: "Send instant interview link" for a shortlisted applicant.
router.post(
  '/applications/:applicationId/instant-interview',
  authorize(...COMPANY_SIDE_ROLES),
  configureInterviews,
  schedulingController.sendInstantInterview
);

// Candidate: browse + book
router.get('/applications/:applicationId/slots', authorize(ROLES.CANDIDATE), schedulingController.listAvailableSlots);
router.post(
  '/applications/:applicationId/book',
  authorize(ROLES.CANDIDATE),
  validate(bookSlotSchema),
  schedulingController.bookSlot
);
router.post('/applications/:applicationId/cancel', authorize(ROLES.CANDIDATE), schedulingController.cancelMyInterview);

// Shared: either the owning candidate or the owning company can read it
// router.get(
//   '/applications/:applicationId/interview',
//   authorize(ROLES.CANDIDATE, ROLES.COMPANY),
//   schedulingController.getInterview
// );
router.get(
  '/applications/:applicationId/interview',
  authorize(ROLES.CANDIDATE, ...COMPANY_SIDE_ROLES),
  requirePermission(PERMISSIONS.REVIEW_CANDIDATES),
  schedulingController.getInterview
);

// Second-round AI interview (agency side). Giving one needs REVIEW_CANDIDATES;
// reading the rounds works for view-only recruiters too.
router.get(
  '/applications/:applicationId/rounds',
  authorize(...COMPANY_SIDE_ROLES),
  requireAnyPermission(...VIEW_CANDIDATE_PERMISSIONS),
  asyncHandler(async (req, res) => ok(res, await getRoundsForCompany(req.user.id, req.params.applicationId)))
);
router.post(
  '/applications/:applicationId/second-round',
  authorize(...COMPANY_SIDE_ROLES),
  requirePermission(PERMISSIONS.REVIEW_CANDIDATES),
  validate(secondRoundSchema),
  asyncHandler(async (req, res) => ok(res, await giveSecondRound(req.user, req.params.applicationId, req.body)))
);

export default router;
