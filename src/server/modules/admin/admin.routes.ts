import { Router } from '../../http/router';
import * as controller from './admin.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { ROLES } from '../../../shared/constants/roles';
import {
  adminCreateCompanySchema,
  adminUpdateCompanySchema,
  adminCompanyStatusSchema,
  adminUserStatusSchema,
} from '../../../shared/schemas/admin.schema';
import { adminCompaniesQuerySchema, adminUsersQuerySchema } from '../../../shared/schemas/query.schema';

// Build plan P1 — Platform Admin only. There is no public admin signup; the
// first admin is created with scripts/create-admin.mjs.
const router = new Router();

router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/companies', validate(adminCompaniesQuerySchema, 'query'), controller.listCompanies);
router.post('/companies', validate(adminCreateCompanySchema), controller.createCompany);
router.get('/companies/:id', controller.getCompany);
router.patch('/companies/:id', validate(adminUpdateCompanySchema), controller.updateCompany);
router.patch('/companies/:id/status', validate(adminCompanyStatusSchema), controller.setCompanyStatus);
router.post('/companies/:id/resend-invite', controller.resendInvite);

router.get('/users', validate(adminUsersQuerySchema, 'query'), controller.listUsers);
router.patch('/users/:id/status', validate(adminUserStatusSchema), controller.setUserStatus);

export default router;
