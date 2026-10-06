'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import LoadingState from './ui/LoadingState';
import { homePathForRole } from '../utils/homePath';

// Build plan P2: `roles` allows several roles (the company area is shared by
// owners and recruiters); `role` still works for a single role.
// Not logged in → /auth/login; logged in with another role → that role's home.
export default function ProtectedRoute({
  role,
  roles,
  children,
}: {
  role?: string;
  roles?: string[];
  children: ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const allowed = roles || (role ? [role] : null);
  const redirectTo = loading ? null : !user ? '/auth/login' : allowed && !allowed.includes(user.role) ? homePathForRole(user.role) : null;

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  if (loading) return <LoadingState label="Checking your session…" />;
  if (redirectTo) return <LoadingState label="Redirecting…" />;
  return <>{children}</>;
}
