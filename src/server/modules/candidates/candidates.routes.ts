import { Router } from '../../http/router';
import * as candidatesController from './candidates.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { ROLES } from '../../../shared/constants/roles';
import { updateCandidateSchema } from '../../../shared/schemas/candidate.schema';

const router = new Router();

router.use(authenticate, authorize(ROLES.CANDIDATE));

router.get('/me', candidatesController.getProfile);
router.patch('/me', validate(updateCandidateSchema), candidatesController.updateProfile);

export default router;
