'use client';

import type { HTMLAttributes } from 'react';
export default function Card({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-xl border border-slate-200/80 bg-white shadow-card transition-shadow duration-200 ${className}`} {...props}>
      {children}
    </div>
  );
}
