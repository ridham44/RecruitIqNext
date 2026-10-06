import type { Req, Res, Next } from '../http/types';

// Wraps async route handlers so rejected promises reach the centralized
// error middleware instead of requiring try/catch in every controller.
export function asyncHandler(fn: (req: Req, res: Res, next: Next) => unknown) {
  return (req: Req, res: Res, next: Next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
