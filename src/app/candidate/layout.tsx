import type { ReactNode } from 'react';
import ProtectedRoute from '@/client/components/ProtectedRoute';
import CandidateLayout from '@/client/layouts/CandidateLayout';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute role="CANDIDATE">
      <CandidateLayout>{children}</CandidateLayout>
    </ProtectedRoute>
  );
}
