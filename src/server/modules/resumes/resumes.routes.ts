import { Router } from '../../http/router';
import * as resumesController from './resumes.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { uploadResume } from '../../middleware/upload';
import { ROLES } from '../../../shared/constants/roles';
import { ApiError } from '../../utils/ApiError';

const router = new Router();

router.use(authenticate, authorize(ROLES.CANDIDATE));


router.post('/', uploadResume, resumesController.uploadResume);
router.get('/', resumesController.listMyResumes);

export default router;
