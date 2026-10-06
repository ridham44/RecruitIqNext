'use client';

import { Building2, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import DashboardLayout, { type NavItem } from './DashboardLayout';

// Build plan P1 — Platform Admin area. Reuses the shared dashboard shell
// (sidebar on desktop, bottom tab bar on mobile).
const navItems: NavItem[] = [
  { to: '/admin/companies', label: 'Agencies', icon: Building2 },
  { to: '/admin/users', label: 'Users', icon: Users },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout navItems={navItems}>{children}</DashboardLayout>;
}
