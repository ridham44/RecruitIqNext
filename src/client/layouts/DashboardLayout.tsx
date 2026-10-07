'use client';

import type { ComponentType, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useNavigate } from '@/client/lib/navigation';
import { useAuth } from '../hooks/useAuth';

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  /** Active only on an exact path match (otherwise sub-paths count too). */
  end?: boolean;
  permission?: string;
}

// A nav link that knows whether it points at the current page.
function NavLink({
  to,
  end,
  className,
  children,
}: {
  to: string;
  end?: boolean;
  className: (state: { isActive: boolean }) => string;
  children: ReactNode;
}) {
  const pathname = usePathname() || '';
  const isActive = end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
  return (
    <Link href={to} className={className({ isActive })} aria-current={isActive ? 'page' : undefined}>
      {children}
    </Link>
  );
}

export default function DashboardLayout({ navItems, children }: { navItems: NavItem[]; children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      {/* Sticky: stays in view while long pages scroll */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white md:flex">
        <div className="flex items-center gap-2.5 border-b border-slate-100 px-6 py-5">
          <img src="/Logo.png" alt="RecruitIQ" className="h-9 w-9 object-contain" />
          <span className="text-lg font-semibold tracking-tight text-slate-900">RecruitIQ</span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-r-full before:bg-brand-600'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-110" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <div className="mb-2 flex items-center gap-2.5 px-3 py-1">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold uppercase text-brand-700"
              aria-hidden="true"
            >
              {user?.email?.[0] || '?'}
            </span>
            <span className="truncate text-xs text-slate-500">{user?.email}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors duration-150 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      {/* min-w-0: without it this flex item grows to its widest child (e.g. a
          min-w table inside overflow-x-auto), so the whole page scrolls
          sideways on phones instead of just the table. */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-md md:hidden">
          <div className="flex items-center gap-2">
            <img src="/Logo.png" alt="RecruitIQ" className="h-8 w-8 object-contain" />
            <span className="text-lg font-semibold tracking-tight text-slate-900">RecruitIQ</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </header>

        {/* Bottom padding reserves space for the fixed mobile tab bar below */}
        <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar — the only navigation on small screens */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200/80 bg-white/95 shadow-[0_-4px_16px_-8px_rgba(15,23,42,0.12)] backdrop-blur-md md:hidden">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            // className={({ isActive }) =>
            //   `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${
            //     isActive ? 'text-brand-600' : 'text-slate-500'
            //   }`
            // }
            // Build plan P4: up to 5 tabs — min-w-0 + truncate keep 320px screens from overflowing.
            className={({ isActive }) =>
              `relative flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-2.5 text-xs font-medium transition-colors duration-150 active:bg-slate-100 ${
                isActive
                  ? 'text-brand-600 before:absolute before:inset-x-1/4 before:top-0 before:h-0.5 before:rounded-b-full before:bg-brand-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {/* {label} */}
            <span className="w-full truncate text-center">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
