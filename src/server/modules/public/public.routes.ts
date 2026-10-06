import { Router } from '../../http/router';
import * as controller from './public.controller';
import { validate } from '../../middleware/validate';
import { uploadResume } from '../../middleware/upload';
import { env } from '../../config/env';
import { ApiError } from '../../utils/ApiError';
// import { otpSendSchema, otpVerifySchema, guestApplySchema, trackTokenSchema } from '../../../shared/schemas/public.schema';
import { otpSendSchema, otpVerifySchema, guestApplySchema, trackTokenSchema, trackBookingSchema } from '../../../shared/schemas/public.schema';

// Build plan P4 — public careers portal API (no login), behind
// FEATURE_GUEST_APPLY. With the flag off these routes answer 404, exactly as
// if they didn't exist.
const router = new Router();

const requireGuestApply = (req, res, next) => {
  if (!env.features.guestApply) throw ApiError.notFound('The careers portal is not enabled', 'FEATURE_DISABLED');
  next();
};

router.get('/careers/:slug', requireGuestApply, controller.getPortal);
router.get('/careers/:slug/jobs/:jobId', requireGuestApply, controller.getPortalJob);

router.post('/otp/send', requireGuestApply, validate(otpSendSchema), controller.sendOtp);
router.post('/otp/verify', requireGuestApply, validate(otpVerifySchema), controller.verifyOtp);

router.post('/cv/parse', requireGuestApply, uploadResume, controller.parseCv);
router.post('/applications', requireGuestApply, validate(guestApplySchema), controller.apply);

// Screening / best-job matching runs inside this request (Vercel doesn't
// guarantee work after the response). Idempotent; the page calls it once,
// then polls GET /track until done.
router.post('/track/process', requireGuestApply, validate(trackTokenSchema), controller.processTracked);

// The candidate's personal status link — always on: candidates have no login,
// so this (linked from every candidate email) is how they check progress.
router.get('/track', controller.getTrackStatus);

// Interview slot booking from the status link — no login (the token is the
// credential and only ever reaches its own application).
router.get('/track/booking', controller.getTrackBooking);
router.post('/track/booking', validate(trackBookingSchema), controller.bookFromTrack);
router.post('/track/booking/cancel', validate(trackTokenSchema), controller.cancelFromTrack);

export default router;
