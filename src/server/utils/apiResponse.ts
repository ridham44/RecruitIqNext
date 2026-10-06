import type { Res } from '../http/types';

// Consistent API response envelope (Section 23).
export function ok(res: Res, data: unknown = {}, status = 200) {
  return res.status(status).json({ success: true, data });
}

export function created(res: Res, data: unknown = {}) {
  return ok(res, data, 201);
}

export function fail(res: Res, { status = 400, message = 'Request failed', error = 'BAD_REQUEST' } = {}) {
  return res.status(status).json({ success: false, message, error });
}
