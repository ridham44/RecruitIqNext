'use client';

import { Users } from 'lucide-react';
import type { ReactNode } from 'react';
import DashboardLayout, { type NavItem } from './DashboardLayout';

// Build plan P8 — client HR portal: one section, the candidates shared with them.
const navItems: NavItem[] = [{ to: '/client/candidates', label: 'Candidates', icon: Users }];

export default function ClientPortalLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout navItems={navItems}>{children}</DashboardLayout>;
}
