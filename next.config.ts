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
    ];
  },
};

export default nextConfig;
