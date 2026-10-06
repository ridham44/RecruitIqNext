import { Router } from '../../http/router';
import * as controller from './recruiters.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { requirePermission } from '../../middleware/permission';
import { COMPANY_SIDE_ROLES } from '../../../shared/constants/roles';
import { PERMISSIONS } from '../../../shared/constants/permissions';
import {
  inviteRecruiterSchema,
  updateRecruiterSchema,
  recruiterStatusSchema,
  recruiterPermissionsSchema,
  recruiterJobsSchema,
  jobRecruitersSchema,
} from '../../../shared/schemas/recruiter.schema';

// Build plan P2 — recruiters inside a recruitment company. The owner always
// has access; a recruiter needs MANAGE_RECRUITERS.
const router = new Router();

router.use(authenticate, authorize(...COMPANY_SIDE_ROLES), requirePermission(PERMISSIONS.MANAGE_RECRUITERS));

router.get('/', controller.list);
router.post('/', validate(inviteRecruiterSchema), controller.invite);
router.get('/job/:jobId', controller.listForJob);
router.put('/job/:jobId', validate(jobRecruitersSchema), controller.setForJob);
router.patch('/:id', validate(updateRecruiterSchema), controller.update);
router.patch('/:id/status', validate(recruiterStatusSchema), controller.setStatus);
router.put('/:id/permissions', validate(recruiterPermissionsSchema), controller.setPermissions);
router.put('/:id/jobs', validate(recruiterJobsSchema), controller.setJobs);
router.post('/:id/resend-invite', controller.resendInvite);

export default router;
