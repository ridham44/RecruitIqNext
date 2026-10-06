import type { Req, Res } from './types';
import type { Router } from './router';
import { ApiError } from '../utils/ApiError';

const JSON_LIMIT_BYTES = 2 * 1024 * 1024;

// Express-style query parsing: a repeated key (?q=a&q=b) or `key[]` becomes
// an array; everything else stays a string.
function parseQuery(params: URLSearchParams): Record<string, any> {
  const query: Record<string, any> = {};
  for (const [rawKey, value] of params) {
    const key = rawKey.endsWith('[]') ? rawKey.slice(0, -2) : rawKey;
    if (key in query) query[key] = [].concat(query[key], value);
    else query[key] = rawKey.endsWith('[]') ? [value] : value;
  }
  return query;
}

// With one trusted proxy hop (nginx / Vercel), the client is the last
// address in X-Forwarded-For — same as Express's `trust proxy: 1`.
function clientIp(headers: Headers) {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',').map((part) => part.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return headers.get('x-real-ip') || '127.0.0.1';
}

async function parseBody(request: Request): Promise<any> {
  if (request.method === 'GET' || request.method === 'HEAD') return {};
  const type = (request.headers.get('content-type') || '').toLowerCase();

  if (type.includes('application/json')) {
    const text = await request.text();
    if (Buffer.byteLength(text) > JSON_LIMIT_BYTES) {
      throw new ApiError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large');
    }
    if (!text.trim()) return {};
    try {
      return JSON.parse(text);
    } catch {
      throw ApiError.badRequest('Request body is not valid JSON', 'INVALID_JSON');
    }
  }

  if (type.includes('application/x-www-form-urlencoded')) {
    return parseQuery(new URLSearchParams(await request.text()));
  }

  // multipart/form-data is read on demand by the upload middleware.
  return {};
}

export async function buildRequest(request: Request): Promise<{ req: Req; error?: unknown }> {
  const url = new URL(request.url);
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const req: Req = {
    method: request.method.toUpperCase(),
    originalUrl: url.pathname + url.search,
    path: url.pathname,
    baseUrl: '',
    headers,
    params: {},
    query: parseQuery(url.searchParams),
    body: {},
    ip: clientIp(request.headers),
    raw: request,
  };

  try {
    req.body = await parseBody(request);
    return { req };
  } catch (error) {
    return { req, error };
  }
}

// Collects what a handler writes and turns it into a Web Response once
// `end()` / `json()` / `send()` is called.
export class ResponseBuilder implements Res {
  statusCode = 200;
  headersSent = false;
  private headers = new Headers();
  private body: BodyInit | null = null;
  private resolveDone!: () => void;
  readonly done = new Promise<void>((resolve) => {
    this.resolveDone = resolve;
  });

  status(code: number) {
    this.statusCode = code;
    return this;
  }

  setHeader(name: string, value: string) {
    this.headers.set(name, String(value));
    return this;
  }

  set(name: string | Record<string, string>, value?: string) {
    if (typeof name === 'string') return this.setHeader(name, value ?? '');
    for (const [key, val] of Object.entries(name)) this.setHeader(key, val);
    return this;
  }

  getHeader(name: string) {
    return this.headers.get(name) ?? undefined;
  }

  type(contentType: string) {
    return this.setHeader('Content-Type', contentType);
  }

  json(body: unknown) {
    if (!this.headers.has('Content-Type')) this.type('application/json; charset=utf-8');
    return this.end(JSON.stringify(body));
  }

  send(body?: unknown) {
    if (body === undefined || body === null) return this.end();
    if (body instanceof Uint8Array || body instanceof ArrayBuffer) {
      if (!this.headers.has('Content-Type')) this.type('application/octet-stream');
      return this.end(body);
    }
    if (typeof body === 'object') return this.json(body);
    if (!this.headers.has('Content-Type')) this.type('text/html; charset=utf-8');
    return this.end(String(body));
  }

  end(body?: unknown) {
    if (this.headersSent) return this;
    this.headersSent = true;
    this.body = (body ?? null) as BodyInit | null;
    this.resolveDone();
    return this;
  }

  toResponse(method: string): Response {
    const noBody = method === 'HEAD' || this.statusCode === 204 || this.statusCode === 304;
    return new Response(noBody ? null : this.body, { status: this.statusCode, headers: this.headers });
  }
}

// Runs one Web Request through the API app. `onError` is the final error
// handler; it must always respond.
export async function dispatch(
  app: Router,
  request: Request,
  onNotFound: (req: Req, res: Res) => void,
  onError: (err: unknown, req: Req, res: Res) => void
): Promise<Response> {
  const res = new ResponseBuilder();
  const { req, error } = await buildRequest(request);

  const finish = (err?: unknown) => {
    if (res.headersSent) return;
    try {
      if (err) onError(err, req, res);
      else onNotFound(req, res);
    } catch (handlerErr) {
      console.error('[api] error handler failed', handlerErr);
      res.status(500).json({ success: false, message: 'Something went wrong', error: 'INTERNAL_ERROR' });
    }
  };

  if (error) finish(error);
  else app.handle(req, res, finish);

  await res.done;
  return res.toResponse(req.method);
}
