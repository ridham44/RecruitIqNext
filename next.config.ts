import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Server-only packages that must be loaded by Node at runtime rather than
  // bundled (native engines, or module-load side effects like pdf-parse's).
  serverExternalPackages: ['@prisma/client', 'pdf-parse', 'mammoth', 'livekit-server-sdk', 'bcryptjs'],
  async redirects() {
    return [
      { source: '/start', destination: '/live-demo', permanent: false },
      { source: '/admin', destination: '/admin/companies', permanent: false },
      { source: '/client', destination: '/client/candidates', permanent: false },
      // No sign-up: agencies are added by the Portal Admin, candidates use /recq links.
      { source: '/auth/register', destination: '/auth/login', permanent: false },
      // Candidates have no login or dashboard — everything reaches them by
      // email. Old /candidate links (e.g. in earlier emails) go to the home page.
      { source: '/candidate', destination: '/', permanent: false },
      { source: '/candidate/:path*', destination: '/', permanent: false },
      // Build plan P9: the public careers portal is retired — old /careers/:slug
      // links (and their job / submit-cv sub-pages) go to the agency's /recq
      // page. /careers/track, the status link in candidate emails, is excluded.
      { source: '/careers/:slug((?!track$)[^/]+)', destination: '/recq/:slug', permanent: false },
      { source: '/careers/:slug((?!track$)[^/]+)/:rest*', destination: '/recq/:slug', permanent: false },
    ];
  },
};

export default nextConfig;
