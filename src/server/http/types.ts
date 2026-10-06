// Request/response shapes for the Express-style API layer that runs inside
// the Next.js Route Handler (src/app/api/[...path]/route.ts). Kept close to
// Express's so route, middleware and controller code reads the same as before.

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface AuthUser {
  id: string;
  role: string;
  email?: string;
  interviewId?: string;
}

export interface Req {
  method: string;
  /** Full path + query, e.g. /api/v1/jobs?page=2 (never changes while routing). */
  originalUrl: string;
  /** Path relative to the router currently handling the request. */
  path: string;
  /** Mount path of the router currently handling the request. */
  baseUrl: string;
  headers: Record<string, string>;
  params: Record<string, string>;
  query: Record<string, any>;
  body: any;
  ip: string;
  file?: UploadedFile;
  user?: AuthUser;
  companyCtx?: any;
  /** The underlying Web Request (used to read multipart bodies). */
  raw: Request;
  [key: string]: any;
}

export interface Res {
  statusCode: number;
  headersSent: boolean;
  status(code: number): Res;
  setHeader(name: string, value: string): Res;
  set(name: string | Record<string, string>, value?: string): Res;
  getHeader(name: string): string | undefined;
  type(contentType: string): Res;
  json(body: unknown): Res;
  send(body?: unknown): Res;
  end(body?: unknown): Res;
}

export type Next = (err?: unknown) => void;

export type Handler = (req: Req, res: Res, next: Next) => unknown;
export type ErrorHandler = (err: unknown, req: Req, res: Res, next: Next) => unknown;
