// Thrown from controllers/services and caught by the centralized error
// handler middleware (Section 23) so route files never format error bodies.
export class ApiError extends Error {
  status: number;
  code: string;
  // { field: message } for form validation errors.
  fields?: Record<string, string>;

  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }

  static badRequest(message: string, code = 'BAD_REQUEST', fields?: Record<string, string>) {
    return new ApiError(400, code, message, fields);
  }

  static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    return new ApiError(401, code, message);
  }

  static forbidden(message = 'Forbidden', code = 'FORBIDDEN') {
    return new ApiError(403, code, message);
  }

  static notFound(message = 'Not found', code = 'NOT_FOUND') {
    return new ApiError(404, code, message);
  }

  static conflict(message = 'Conflict', code = 'CONFLICT') {
    return new ApiError(409, code, message);
  }

  static internal(message = 'Internal server error', code = 'INTERNAL_ERROR') {
    return new ApiError(500, code, message);
  }
}
