import { Router } from '../../http/router';
import { z } from 'zod';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { ok } from '../../utils/apiResponse';
import * as instant from './instantInterview.service';

// Build plan P5 — public instant-interview link endpoints (no login; the
// link token is the credential). Every call answers 404 FEATURE_DISABLED
// while FEATURE_INSTANT_INTERVIEW is off (checked in the service).
const router = new Router();

const sendSchema = z.object({ channel: z.enum(['email', 'sms']) });

router.get(
  '/:token',
  asyncHandler(async (req, res) => {
    ok(res, await instant.getInvite(req.params.token));
  })
);

router.post(
  '/:token/session',
  asyncHandler(async (req, res) => {
    ok(res, await instant.createSession(req.params.token));
  })
);

router.post(
  '/:token/send',
  validate(sendSchema),
  asyncHandler(async (req, res) => {
    ok(res, await instant.sendInviteByToken(req.params.token, req.body.channel));
  })
);

export default router;
