'use client';

import { useEffect, useState, type ReactNode } from 'react';
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
  // The first client render must match the server HTML ("Checking your
  // session…"). This subtree can hydrate after AuthProvider's effect has
  // already finished loading (e.g. no token → instant), so wait until mounted.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const allowed = roles || (role ? [role] : null);
  const redirectTo = loading ? null : !user ? '/auth/login' : allowed && !allowed.includes(user.role) ? homePathForRole(user.role) : null;

  useEffect(() => {
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);

  if (!mounted || loading) return <LoadingState label="Checking your session…" />;
  if (redirectTo) return <LoadingState label="Redirecting…" />;
  return <>{children}</>;
}
