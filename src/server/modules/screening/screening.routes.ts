import { Router } from '../../http/router';
import * as screeningController from './screening.controller';
import { authenticate, authorize } from '../../middleware/auth';
// import { ROLES } from '../../../shared/constants/roles';
import { COMPANY_SIDE_ROLES } from '../../../shared/constants/roles';
import { PERMISSIONS } from '../../../shared/constants/permissions';
import { requirePermission } from '../../middleware/permission';
import { validate } from '../../middleware/validate';
import { rankedQuerySchema } from '../../../shared/schemas/query.schema';

const router = new Router();

// router.use(authenticate, authorize(ROLES.COMPANY));
// Build plan P2: owners and recruiters (job access is checked by getOwnedJob).
router.use(authenticate, authorize(...COMPANY_SIDE_ROLES), requirePermission(PERMISSIONS.REVIEW_CANDIDATES));

router.post('/job/:jobId/run', screeningController.runForJob);
// Build plan P9 (§22 mode 2): re-score candidates who completed interviews.
router.post('/job/:jobId/run-final', screeningController.runFinalForJob);
router.post('/application/:applicationId/run', screeningController.runForApplication);
router.get('/job/:jobId/ranked', validate(rankedQuerySchema, 'query'), screeningController.getRanked);
router.get('/job/:jobId/top', screeningController.getTop10);

export default router;
