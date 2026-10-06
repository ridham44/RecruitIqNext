import { asyncHandler } from '../../utils/asyncHandler';
import { created, ok } from '../../utils/apiResponse';
import { ApiError } from '../../utils/ApiError';
import * as resumesService from './resumes.service';

export const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No resume file provided', 'FILE_REQUIRED');
  const { resume, profileSuggestions } = await resumesService.uploadResume(req.user.id, req.file);
  created(res, { resume, profileSuggestions });
});

export const listMyResumes = asyncHandler(async (req, res) => {
  const resumes = await resumesService.listMyResumes(req.user.id);
  ok(res, { resumes });
});
