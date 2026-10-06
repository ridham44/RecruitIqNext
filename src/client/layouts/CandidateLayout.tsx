'use client';

import { LayoutDashboard, FileText, User } from 'lucide-react';
import type { ReactNode } from 'react';
import DashboardLayout, { type NavItem } from './DashboardLayout';

// Build plan P9 (§1): no "Find Jobs" — there is no cross-agency job board;
// candidates reach an agency's jobs only through its /recq link.
const navItems: NavItem[] = [
  { to: '/candidate/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/candidate/applications', label: 'My Applications', icon: FileText },
  { to: '/candidate/profile', label: 'Profile', icon: User },
];

export default function CandidateLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout navItems={navItems}>{children}</DashboardLayout>;
}
