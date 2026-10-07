'use client';

import type { ReactNode } from 'react';
import Button from './Button';

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]">
      <div role="alertdialog" aria-modal="true" className="w-full max-w-sm animate-dialog-in rounded-2xl bg-white p-5 shadow-dialog sm:p-6">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {description && <p className="mt-2 text-sm text-slate-500">{description}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
