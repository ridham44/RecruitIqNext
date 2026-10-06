import { Router } from '../../http/router';
import * as educationController from './education.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { ROLES } from '../../../shared/constants/roles';
import { educationSchema, updateEducationSchema } from '../../../shared/schemas/education.schema';

const router = new Router();

router.use(authenticate, authorize(ROLES.CANDIDATE));

router.get('/', educationController.listEducations);
router.post('/', validate(educationSchema), educationController.addEducation);
router.patch('/:id', validate(updateEducationSchema), educationController.updateEducation);
router.delete('/:id', educationController.deleteEducation);

export default router;
