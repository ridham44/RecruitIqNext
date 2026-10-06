import { ApiError } from '../utils/ApiError';
import { isProduction } from '../config/env';
import type { Req, Res } from '../http/types';

export function notFoundHandler(req: Req, res: Res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    error: 'ROUTE_NOT_FOUND',
  });
}

export function errorHandler(err: unknown, req: Req, res: Res) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
      error: err.code,
      ...(err.fields ? { fields: err.fields } : {}),
    });
  }

  // Never leak stack traces / internals to the client in production
  // (Section 23), but keep them in server logs for debugging.
  console.error('[unhandled error]', err);

  res.status(500).json({
    success: false,
    message: isProduction ? 'Something went wrong' : (err as Error)?.message,
    error: 'INTERNAL_ERROR',
  });
}
