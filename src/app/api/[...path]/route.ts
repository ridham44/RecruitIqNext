import { createApp } from '@/server/app';
import { dispatch } from '@/server/http/adapter';
import { notFoundHandler, errorHandler } from '@/server/middleware/errorHandler';
import { env } from '@/server/config/env';

// Every /api/* request is served here by the API router tree (src/server/app.ts).
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// AI screening / interview reports run inside the request.
export const maxDuration = 60;

const app = createApp();

// Auth is a stateless Bearer JWT — no cookies — so credentials are never
// allowed cross-origin. The app and API share one origin; CLIENT_URL (a
// comma-separated list) only matters for an external client calling the API.
const allowedOrigins = new Set(env.clientUrl.split(',').map((origin) => origin.trim()));

function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin');
  if (!origin || !allowedOrigins.has(origin)) return {};
  return { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' };
}

async function handle(request: Request) {
  const response = await dispatch(app, request, notFoundHandler, errorHandler);
  for (const [key, value] of Object.entries(corsHeaders(request))) response.headers.set(key, value);
  return response;
}

export function OPTIONS(request: Request) {
  const headers: Record<string, string> = {
    ...corsHeaders(request),
    'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
  };
  const requested = request.headers.get('access-control-request-headers');
  if (requested) headers['Access-Control-Allow-Headers'] = requested;
  return new Response(null, { status: 204, headers });
}

export { handle as GET, handle as HEAD, handle as POST, handle as PUT, handle as PATCH, handle as DELETE };
