import { Router } from '../../http/router';
import * as controller from './recq.controller';
import { validate } from '../../middleware/validate';
import { uploadResume } from '../../middleware/upload';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
import { recqOtpSendSchema, recqOtpVerifySchema, recqApplySchema } from '../../../shared/schemas/recq.schema';

// Build plan P9 — the /recq agency-link candidate API (no login), all behind
// FEATURE_RECQ. With the flag off every route answers 404, exactly as if the
// routes didn't exist.
const router = new Router();

router.use((req, res, next) => {
  if (!env.features.recq) throw ApiError.notFound('This recruitment page is not available', 'FEATURE_DISABLED');
  next();
});

// Read: agency page (OPEN jobs) and a single job.
router.get('/:agencySlug', controller.getAgency);
router.get('/:agencySlug/jobs/:jobSlug', controller.getAgencyJob);

// Resume matching (upload happens in-request; the match runs synchronously).
// uploadResume reports a bad type / too-large file as an ApiError itself.
router.post('/:agencySlug/match', uploadResume, controller.discover); // Option B — across the agency
router.post('/:agencySlug/jobs/:jobSlug/match', uploadResume, controller.matchJob); // Option A / Part 2 — one job

// Email OTP (code goes only to the resume's email) + apply.
router.post('/:agencySlug/otp/send', validate(recqOtpSendSchema), controller.sendOtp);
router.post('/:agencySlug/otp/verify', validate(recqOtpVerifySchema), controller.verifyOtp);
router.post('/:agencySlug/apply', validate(recqApplySchema), controller.apply);

export default router;
