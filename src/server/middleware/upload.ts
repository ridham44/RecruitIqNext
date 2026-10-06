import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import type { Req, Res, Next } from '../http/types';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
]);

const ALLOWED_EXTENSIONS = new Set(['pdf', 'docx']);

// Reads a multipart/form-data body with a single `resume` file field into
// req.file ({ originalname, mimetype, size, buffer }) and its text fields into
// req.body. Memory only — never writes to local disk, so the upload path stays
// serverless-safe; the buffer is handed to the storage driver abstraction,
// which decides where the bytes actually end up (Section 9). Errors (bad type,
// too large) are ApiErrors, so they reach the client in the usual envelope.
export async function uploadResume(req: Req, res: Res, next: Next) {
  const type = req.headers['content-type'] || '';
  if (!type.toLowerCase().includes('multipart/form-data')) return next();

  let form: FormData;
  try {
    form = await req.raw.formData();
  } catch {
    throw ApiError.badRequest('Could not read the uploaded file', 'UPLOAD_FAILED');
  }

  const body: Record<string, string> = {};
  for (const [name, value] of form.entries()) {
    if (typeof value === 'string') {
      body[name] = value;
      continue;
    }
    if (name !== 'resume') throw ApiError.badRequest('Unexpected field', 'UPLOAD_FAILED');

    const ext = (value.name.split('.').pop() || '').toLowerCase();
    // Validate both the MIME type AND extension — never trust the extension
    // alone (Section 9). The buffer's magic bytes are re-checked in
    // resume/extract.service.ts before parsing.
    if (!ALLOWED_MIME_TYPES.has(value.type) || !ALLOWED_EXTENSIONS.has(ext)) {
      throw ApiError.badRequest('Only PDF and DOCX resumes are supported', 'INVALID_FILE_TYPE');
    }
    if (value.size > env.maxResumeSizeMb * 1024 * 1024) {
      throw ApiError.badRequest('Resume file exceeds the maximum allowed size', 'FILE_TOO_LARGE');
    }
    req.file = {
      fieldname: name,
      originalname: value.name,
      mimetype: value.type,
      size: value.size,
      buffer: Buffer.from(await value.arrayBuffer()),
    };
  }

  req.body = body;
  next();
}
