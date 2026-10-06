'use client';

import { LayoutDashboard, Search, FileText, User } from 'lucide-react';
import type { ReactNode } from 'react';
import DashboardLayout, { type NavItem } from './DashboardLayout';

const navItems: NavItem[] = [
  { to: '/candidate/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/candidate/jobs', label: 'Find Jobs', icon: Search },
  { to: '/candidate/applications', label: 'My Applications', icon: FileText },
  { to: '/candidate/profile', label: 'Profile', icon: User },
];

export default function CandidateLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout navItems={navItems}>{children}</DashboardLayout>;
}
