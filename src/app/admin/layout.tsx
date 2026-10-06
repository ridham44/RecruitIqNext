import type { ReactNode } from 'react';
import ProtectedRoute from '@/client/components/ProtectedRoute';
import AdminLayout from '@/client/layouts/AdminLayout';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute role="ADMIN">
      <AdminLayout>{children}</AdminLayout>
    </ProtectedRoute>
  );
}
