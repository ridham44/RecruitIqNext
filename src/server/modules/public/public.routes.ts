import { Router } from '../../http/router';
import * as controller from './public.controller';
import { validate } from '../../middleware/validate';
import { uploadResume } from '../../middleware/upload';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
// import { otpSendSchema, otpVerifySchema, guestApplySchema, trackTokenSchema } from '../../../shared/schemas/public.schema';
import { otpSendSchema, otpVerifySchema, guestApplySchema, trackTokenSchema, trackBookingSchema } from '../../../shared/schemas/public.schema';

// Build plan P4 — public careers portal API (no login), all behind
// FEATURE_GUEST_APPLY. With the flag off every route answers 404, exactly as
// if the routes didn't exist.
const router = new Router();

router.use((req, res, next) => {
  if (!env.features.guestApply) throw ApiError.notFound('The careers portal is not enabled', 'FEATURE_DISABLED');
  next();
});


router.get('/careers/:slug', controller.getPortal);
router.get('/careers/:slug/jobs/:jobId', controller.getPortalJob);

router.post('/otp/send', validate(otpSendSchema), controller.sendOtp);
router.post('/otp/verify', validate(otpVerifySchema), controller.verifyOtp);

router.post('/cv/parse', uploadResume, controller.parseCv);
router.post('/applications', validate(guestApplySchema), controller.apply);

// Screening / best-job matching runs inside this request (Vercel doesn't
// guarantee work after the response). Idempotent; the page calls it once,
// then polls GET /track until done.
router.post('/track/process', validate(trackTokenSchema), controller.processTracked);
router.get('/track', controller.getTrackStatus);

// Interview slot booking from the status link — no login (the token is the
// credential and only ever reaches its own application).
router.get('/track/booking', controller.getTrackBooking);
router.post('/track/booking', validate(trackBookingSchema), controller.bookFromTrack);
router.post('/track/booking/cancel', validate(trackTokenSchema), controller.cancelFromTrack);

export default router;
