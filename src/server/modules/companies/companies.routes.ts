import { Router } from '../../http/router';
import * as companiesController from './companies.controller';
import { authenticate, authorize } from '../../middleware/auth';
// import { ROLES } from '../../../shared/constants/roles';
import { COMPANY_SIDE_ROLES } from '../../../shared/constants/roles';
import { requireOwner } from '../../middleware/permission';
import { validate } from '../../middleware/validate';
import { careersSlugSchema } from '../../../shared/schemas/public.schema';
import { updateCompanyProfileSchema } from '../../../shared/schemas/company.schema';

const router = new Router();

// router.use(authenticate, authorize(ROLES.COMPANY));
// Build plan P2: owners and recruiters.
router.use(authenticate, authorize(...COMPANY_SIDE_ROLES));

router.get('/me', companiesController.getProfile);
// router.patch('/me', companiesController.updateProfile);
// Build plan P2: recruiters can view but not edit the company profile.
router.patch('/me', requireOwner, validate(updateCompanyProfileSchema), companiesController.updateProfile);
router.get('/dashboard-overview', companiesController.getDashboardOverview);
// Build plan P4: careers portal link (anyone can view; only the owner renames it).
router.get('/careers-link', companiesController.getCareersLink);
router.patch('/careers-link', requireOwner, validate(careersSlugSchema), companiesController.setCareersLink);

export default router;

