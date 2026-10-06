import { asyncHandler } from '../../utils/asyncHandler';
import { ok } from '../../utils/apiResponse';
import * as candidatesService from './candidates.service';

export const getProfile = asyncHandler(async (req, res) => {
  const candidate = await candidatesService.getCandidateByUserId(req.user.id);
  ok(res, { candidate });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const candidate = await candidatesService.updateCandidateProfile(req.user.id, req.body);
  ok(res, { candidate });
});
