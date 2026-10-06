import { Router } from '../../http/router';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { requirePermission } from '../../middleware/permission';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok, created } from '../../utils/apiResponse';
import { COMPANY_SIDE_ROLES } from '../../../shared/constants/roles';
import { PERMISSIONS } from '../../../shared/constants/permissions';
import { cvPoolApplySchema } from '../../../shared/schemas/public.schema';
import * as service from './cvPool.service';
import { cvPoolQuerySchema } from '../../../shared/schemas/query.schema';

// Build plan P4 — owners and recruiters with REVIEW_CANDIDATES.
const router = new Router();

router.use(authenticate, authorize(...COMPANY_SIDE_ROLES), requirePermission(PERMISSIONS.REVIEW_CANDIDATES));

router.get(
  '/',
  validate(cvPoolQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    ok(res, { submissions: await service.listPool(req.user.id, { status: req.query.status }) });
  })
);

router.post(
  '/:id/apply',
  validate(cvPoolApplySchema),
  asyncHandler(async (req, res) => {
    created(res, await service.applyToJob(req.user.id, req.params.id, req.body.jobId));
  })
);

export default router;
