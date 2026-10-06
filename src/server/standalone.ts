import http from 'http';
import { createApp } from './app';
import { dispatch } from './http/adapter';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';

// The API router tree on a plain Node HTTP server — same handlers as the
// Next.js Route Handler (src/app/api/[...path]/route.ts), minus Next. Used by
// scripts (demo seeding, flow tests) that need a running API without
// `next dev`:
//   import('./src/server/standalone.ts').then(({ listen }) => listen(3101, () => ...))
export function listen(port: number, onReady?: () => void) {
  const app = createApp();
  const server = http.createServer(async (req, res) => {
    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
      }
      const method = (req.method || 'GET').toUpperCase();
      const request = new Request(`http://${req.headers.host || 'localhost'}${req.url || '/'}`, {
        method,
        headers,
        body: method === 'GET' || method === 'HEAD' || chunks.length === 0 ? undefined : Buffer.concat(chunks),
      });
      const response = await dispatch(app, request, notFoundHandler, errorHandler);
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch (err) {
      console.error('[standalone] request failed', err);
      if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Something went wrong', error: 'INTERNAL_ERROR' }));
    }
  });
  return server.listen(port, onReady);
}
