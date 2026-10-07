'use client';

import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ErrorState({ message = 'Something went wrong.', onRetry }: { message?: ReactNode; onRetry?: () => void }) {
  return (
    <div className="flex animate-fade-in flex-col items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50/70 px-6 py-12 text-center" role="alert">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
        <AlertTriangle className="h-6 w-6 text-red-500" />
      </span>
      <p className="max-w-md text-sm text-red-700">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex min-h-[40px] items-center rounded-lg border border-red-200 bg-white px-4 text-sm font-medium text-red-700 shadow-sm transition-colors hover:bg-red-50"
        >
          Try again
        </button>
      )}
    </div>
  );
}
