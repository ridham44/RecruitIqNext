import { Router } from '../../http/router';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import type { Req, Res, Next } from '../../http/types';
import * as applicationsController from './applications.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { ROLES, COMPANY_SIDE_ROLES } from '../../../shared/constants/roles';
// import { PERMISSIONS } from '../../../shared/constants/permissions';
// import { requirePermission } from '../../middleware/permission';
import { PERMISSIONS, VIEW_CANDIDATE_PERMISSIONS } from '../../../shared/constants/permissions';
import { requirePermission, requireAnyPermission } from '../../middleware/permission';
import { applyToJobSchema, bulkUpdateApplicationStatusSchema } from '../../../shared/schemas/application.schema';

const router = new Router();

router.use(authenticate);

// Candidate
// Build plan P9 (§1): logged-in candidates can't apply to an arbitrary job id
// (any agency) — applications come through the agency's /recq link, unless
// the legacy FEATURE_CANDIDATE_JOB_BOARD is on.
function requireJobBoard(req: Req, res: Res, next: Next) {
  if (!env.features.candidateJobBoard) {
    return next(ApiError.forbidden("Please apply through the link your recruitment agency shared with you", 'APPLY_VIA_AGENCY_LINK'));
  }
  return next();
}
router.post('/', authorize(ROLES.CANDIDATE), requireJobBoard, validate(applyToJobSchema), applicationsController.apply);
router.get('/mine', authorize(ROLES.CANDIDATE), applicationsController.listMine);
router.get('/mine/:id', authorize(ROLES.CANDIDATE), applicationsController.getMine);

// Company
// router.get('/job/:jobId', authorize(ROLES.COMPANY), applicationsController.listForJob);
// router.get('/job/:jobId/candidates/:candidateId', authorize(ROLES.COMPANY), applicationsController.getCandidateDetail);
// router.patch(
//   '/job/:jobId/bulk-status',
//   authorize(ROLES.COMPANY),
//   validate(bulkUpdateApplicationStatusSchema),
//   applicationsController.bulkUpdateStatus
// );
// router.patch('/:applicationId/reject', authorize(ROLES.COMPANY), applicationsController.reject);
// Build plan P2: owners, and recruiters with REVIEW_CANDIDATES on an assigned job.
const reviewCandidates = requirePermission(PERMISSIONS.REVIEW_CANDIDATES);
// router.get('/job/:jobId', authorize(...COMPANY_SIDE_ROLES), reviewCandidates, applicationsController.listForJob);
// router.get('/job/:jobId/candidates/:candidateId', authorize(...COMPANY_SIDE_ROLES), reviewCandidates, applicationsController.getCandidateDetail);
// Reading applicants / a candidate / the CV: VIEW_CANDIDATES or REVIEW_CANDIDATES.
// Every change below still needs REVIEW_CANDIDATES.
const viewCandidates = requireAnyPermission(...VIEW_CANDIDATE_PERMISSIONS);
router.get('/job/:jobId', authorize(...COMPANY_SIDE_ROLES), viewCandidates, applicationsController.listForJob);
router.get('/job/:jobId/candidates/:candidateId', authorize(...COMPANY_SIDE_ROLES), viewCandidates, applicationsController.getCandidateDetail);
router.get('/job/:jobId/candidates/:candidateId/cv', authorize(...COMPANY_SIDE_ROLES), viewCandidates, applicationsController.getCandidateCv);
router.patch(
  '/job/:jobId/bulk-status',
  authorize(...COMPANY_SIDE_ROLES),
  reviewCandidates,
  validate(bulkUpdateApplicationStatusSchema),
  applicationsController.bulkUpdateStatus
);
router.patch('/:applicationId/reject', authorize(...COMPANY_SIDE_ROLES), reviewCandidates, applicationsController.reject);

export default router;
