import { ApiError } from '../utils/ApiError';
import { ROLES } from '../../shared/constants/roles';
import { getCompanyContext } from '../modules/companies/companyContext';
import type { Req, Res, Next } from '../http/types';

// Build plan P2: route-level permission check for recruiters.
// Company owners (role COMPANY) always pass WITHOUT any extra lookup, so
// owner behavior is byte-for-byte what it was before recruiters existed.
// Use after authenticate + authorize(...COMPANY_SIDE_ROLES).
// Only the company owner (e.g. editing the company profile).
export function requireOwner(req: Req, res: Res, next: Next) {
  if (req.user?.role === ROLES.COMPANY) return next();
  throw ApiError.forbidden('Only the agency owner can do this', 'PERMISSION_DENIED');
}

// Passes when a recruiter holds at least one of the given permissions
// (e.g. read-only routes: VIEW_CANDIDATES or REVIEW_CANDIDATES).
export function requireAnyPermission(...permissions: string[]) {
  return async (req: Req, res: Res, next: Next) => {
    try {
      if (req.user?.role !== ROLES.RECRUITER) return next();
      const ctx = await getCompanyContext(req.user.id);
      if (!ctx.isActive) throw ApiError.unauthorized('Your account is inactive', 'ACCOUNT_INACTIVE');
      if (!ctx.isOwner && !permissions.some((p) => ctx.permissions.includes(p))) {
        throw ApiError.forbidden("You don't have permission to do this. Ask your agency owner.", 'PERMISSION_DENIED');
      }
      req.companyCtx = ctx;
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function requirePermission(permission: string) {
  return async (req: Req, res: Res, next: Next) => {
    try {
      // Only recruiters are narrowed. Owners, and candidates on shared
      // candidate/company routes, were already filtered by authorize().
      if (req.user?.role !== ROLES.RECRUITER) return next();

      const ctx = await getCompanyContext(req.user.id);
      if (!ctx.isActive) throw ApiError.unauthorized('Your account is inactive', 'ACCOUNT_INACTIVE');
      if (!ctx.isOwner && !ctx.permissions.includes(permission)) {
        throw ApiError.forbidden("You don't have permission to do this. Ask your agency owner.", 'PERMISSION_DENIED');
      }
      req.companyCtx = ctx;
      next();
    } catch (err) {
      next(err);
    }
  };
}
