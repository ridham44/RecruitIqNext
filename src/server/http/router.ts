import type { Handler, ErrorHandler, Next, Req, Res } from './types';

// A small Express-compatible router. Route modules keep the familiar
// `router.get('/:id', authenticate, validate(schema), controller.fn)` shape,
// with the same semantics Express 4 gives them:
//  - layers run in registration order; `use()` matches a path prefix,
//    verb methods match the whole path (trailing slash optional,
//    case-insensitive), and HEAD falls back to GET routes;
//  - `next(err)` skips ahead to the next error handler (4-argument function);
//  - a router mounted with `use('/prefix', router)` sees paths relative to
//    its mount point, and an unmatched request falls through to the
//    parent's next layer — so overlapping mounts (e.g. `/candidates` and
//    `/candidates/me/education`) behave exactly as they did under Express.
// Unlike Express 4, a rejected promise from an async handler is forwarded
// to `next(err)` instead of being dropped.

type Fn = Handler | ErrorHandler | Router;

interface Layer {
  method: string | null; // null → use()
  regexp: RegExp;
  keys: string[];
  handlers: Fn[];
}

function escapeRegExp(text: string) {
  return text.replace(/[.+*?^${}()|[\]\\]/g, '\\$&');
}

function compile(path: string, end: boolean): { regexp: RegExp; keys: string[] } {
  const keys: string[] = [];
  const trimmed = path === '/' ? '' : path.replace(/\/$/, '');
  const source = trimmed
    .split('/')
    .map((segment) => {
      if (segment.startsWith(':')) {
        keys.push(segment.slice(1));
        return '([^/]+?)';
      }
      return escapeRegExp(segment);
    })
    .join('/');
  const pattern = end ? `^${source}\\/?$` : `^${source}(?=\\/|$)`;
  return { regexp: new RegExp(pattern, 'i'), keys };
}

function isRouter(fn: Fn): fn is Router {
  return fn instanceof Router;
}

function invoke(fn: Handler | ErrorHandler, args: unknown[], next: Next) {
  try {
    const result = (fn as (...a: unknown[]) => unknown)(...args);
    if (result && typeof (result as Promise<unknown>).then === 'function') {
      (result as Promise<unknown>).then(undefined, next);
    }
  } catch (err) {
    next(err);
  }
}

export class Router {
  private stack: Layer[] = [];

  use(...args: Array<string | Fn>): this {
    const path = typeof args[0] === 'string' ? (args.shift() as string) : '/';
    const { regexp, keys } = compile(path, false);
    this.stack.push({ method: null, regexp, keys, handlers: args as Fn[] });
    return this;
  }

  private route(method: string, path: string, handlers: Fn[]): this {
    const { regexp, keys } = compile(path, true);
    this.stack.push({ method, regexp, keys, handlers });
    return this;
  }

  get(path: string, ...handlers: Fn[]) {
    return this.route('GET', path, handlers);
  }
  post(path: string, ...handlers: Fn[]) {
    return this.route('POST', path, handlers);
  }
  put(path: string, ...handlers: Fn[]) {
    return this.route('PUT', path, handlers);
  }
  patch(path: string, ...handlers: Fn[]) {
    return this.route('PATCH', path, handlers);
  }
  delete(path: string, ...handlers: Fn[]) {
    return this.route('DELETE', path, handlers);
  }

  // Runs the request through this router; calls `out` when nothing here
  // finished the response (with the pending error, if any).
  handle(req: Req, res: Res, out: Next): void {
    const parentPath = req.path;
    const parentBase = req.baseUrl;
    let index = 0;

    const next: Next = (err) => {
      req.path = parentPath;
      req.baseUrl = parentBase;
      if (res.headersSent) return;

      while (index < this.stack.length) {
        const layer = this.stack[index++];
        const match = layer.regexp.exec(parentPath);
        if (!match) continue;

        if (layer.method) {
          if (err) continue; // routes never handle errors
          const method = req.method === 'HEAD' ? 'GET' : req.method;
          if (layer.method !== method && layer.method !== req.method) continue;
          req.params = Object.fromEntries(layer.keys.map((key, i) => [key, decodeURIComponent(match[i + 1])]));
          return this.runHandlers(layer.handlers, req, res, undefined, next);
        }

        const matched = match[0];
        return this.runHandlers(layer.handlers, req, res, err, next, () => {
          req.baseUrl = parentBase + matched;
          req.path = parentPath.slice(matched.length) || '/';
        });
      }

      out(err);
    };

    next();
  }

  private runHandlers(handlers: Fn[], req: Req, res: Res, initialErr: unknown, done: Next, mount?: () => void) {
    let i = 0;
    const step: Next = (err) => {
      if (res.headersSent) return;
      while (i < handlers.length) {
        const fn = handlers[i++];
        if (isRouter(fn)) {
          if (err) continue;
          mount?.();
          return fn.handle(req, res, step);
        }
        const isErrorHandler = fn.length === 4;
        if (err && isErrorHandler) return invoke(fn, [err, req, res, step], step);
        if (!err && !isErrorHandler) return invoke(fn, [req, res, step], step);
      }
      done(err);
    };
    step(initialErr);
  }
}
