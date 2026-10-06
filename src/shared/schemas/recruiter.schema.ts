import { z } from 'zod';
import { emailSchema, personNameSchema, idSchema } from './common';
import { ASSIGNABLE_PERMISSIONS } from '../constants/permissions';

// Build plan P2 — recruiter management requests.

const permissionsSchema = z
  .array(z.enum(ASSIGNABLE_PERMISSIONS as [string, ...string[]], { errorMap: () => ({ message: 'Unknown permission' }) }))
  .max(ASSIGNABLE_PERMISSIONS.length)
  .transform((list) => [...new Set(list)]);
const idListSchema = z
  .array(idSchema())
  .max(500, 'Too many items selected')
  .transform((list) => [...new Set(list)]);

export const inviteRecruiterSchema = z.object({
  email: emailSchema,
  fullName: personNameSchema('Name'),
  permissions: permissionsSchema.default([]),
  jobIds: idListSchema.default([]),
});

export const updateRecruiterSchema = z.object({
  fullName: personNameSchema('Name'),
});

export const recruiterStatusSchema = z.object({
  isActive: z.boolean(),
});

export const recruiterPermissionsSchema = z.object({
  permissions: permissionsSchema,
});

export const recruiterJobsSchema = z.object({
  jobIds: idListSchema,
});

export const jobRecruitersSchema = z.object({
  memberIds: idListSchema,
});
