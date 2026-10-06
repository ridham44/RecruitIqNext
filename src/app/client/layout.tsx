import type { ReactNode } from 'react';
import ProtectedRoute from '@/client/components/ProtectedRoute';
import ClientPortalLayout from '@/client/layouts/ClientPortalLayout';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute role="CLIENT_HR">
      <ClientPortalLayout>{children}</ClientPortalLayout>
    </ProtectedRoute>
  );
}
