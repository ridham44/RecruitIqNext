'use client';

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

// Build plan P2: generic dialog — a full-height sheet on phones, a centered
// card from sm up. Content scrolls inside so the page never overflows.
export default function Modal({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title?: ReactNode;
  onClose: () => void;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-slate-900/50 backdrop-blur-[2px] sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title as string}
        className="flex max-h-[92vh] w-full animate-sheet-in flex-col rounded-t-2xl bg-white shadow-dialog sm:max-h-[85vh] sm:max-w-lg sm:animate-dialog-in sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab handle — a visual cue that this is a sheet on phones */}
        <div className="flex justify-center pt-2 sm:hidden" aria-hidden="true">
          <span className="h-1 w-10 rounded-full bg-slate-300" />
        </div>
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>
        {footer && <div className="rounded-b-2xl border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-5">{footer}</div>}
      </div>
    </div>
  );
}
