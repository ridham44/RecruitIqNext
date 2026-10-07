'use client';

import type { ComponentType, ReactNode } from 'react';
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: ComponentType<{ className?: string }>;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex animate-fade-up flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      {Icon && (
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 ring-8 ring-slate-50">
          <Icon className="h-7 w-7 text-slate-400" />
        </span>
      )}
      <div className="max-w-sm">
        <p className="font-semibold text-slate-800">{title}</p>
        {description && <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
