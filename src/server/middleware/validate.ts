import type { ZodTypeAny } from 'zod';
import { ApiError } from '../utils/ApiError';
import { fieldErrors } from '../../shared/schemas/common';
import type { Req, Res, Next } from '../http/types';

// Generic Zod request validator (Section 22 — input validation).
// Usage: router.post('/', validate(createJobSchema), controller.create)
//        router.get('/', validate(listQuerySchema, 'query'), controller.list)
// Responds 400 with `fields: { field: message }` so forms can show each error
// under its input.
export function validate(schema: ZodTypeAny, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Req, res: Res, next: Next) => {
    const result = schema.safeParse(req[source] ?? {});
    if (!result.success) {
      const fields = fieldErrors(result.error);
      const message = Object.values(fields).join(' · ');
      throw ApiError.badRequest(message, 'VALIDATION_ERROR', fields);
    }
    req[source] = result.data;
    next();
  };
}
