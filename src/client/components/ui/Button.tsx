'use client';

import type { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-brand-600 text-white shadow-sm shadow-brand-600/20 hover:bg-brand-700 hover:shadow-md hover:shadow-brand-600/25 focus-visible:ring-brand-500/60',
  secondary: 'bg-white text-slate-700 border border-slate-300 shadow-sm hover:border-slate-400 hover:bg-slate-50 focus-visible:ring-slate-400/60',
  danger: 'bg-red-600 text-white shadow-sm shadow-red-600/20 hover:bg-red-700 hover:shadow-md hover:shadow-red-600/25 focus-visible:ring-red-500/60',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-400/60',
};

export default function Button({
  children,
  variant = 'primary',
  loading = false,
  disabled,
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANTS;
  loading?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex min-h-[44px] select-none items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium
        transition-all duration-150 ease-out active:scale-[0.98]
        disabled:cursor-not-allowed disabled:active:scale-100 disabled:opacity-60 disabled:shadow-none
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
