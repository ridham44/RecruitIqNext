'use client';

import { Suspense, type ReactNode } from 'react';
import { AuthProvider } from '@/client/hooks/useAuth';
import LoadingState from '@/client/components/ui/LoadingState';

// Auth lives in the browser (JWT in localStorage), so the session provider is
// a client component. The Suspense boundary lets pages read the query string
// (useSearchParams) while still being prerendered.
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <Suspense fallback={<LoadingState />}>{children}</Suspense>
    </AuthProvider>
  );
}
