'use client';

import { Loader2 } from 'lucide-react';

export default function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex animate-fade-in flex-col items-center justify-center gap-3 py-16 text-slate-500" role="status" aria-live="polite">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </span>
      <p className="text-sm">{label}</p>
    </div>
  );
}
