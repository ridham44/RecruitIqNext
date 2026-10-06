import type { ReactNode } from 'react';
import ProtectedRoute from '@/client/components/ProtectedRoute';
import CompanyLayout from '@/client/layouts/CompanyLayout';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute roles={['COMPANY', 'RECRUITER']}>
      <CompanyLayout>{children}</CompanyLayout>
    </ProtectedRoute>
  );
}
