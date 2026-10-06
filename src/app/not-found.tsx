'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingState from '@/client/components/ui/LoadingState';

// Unknown pages go back to the landing page.
export default function NotFound() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/');
  }, [router]);
  return <LoadingState label="Redirecting…" />;
}
