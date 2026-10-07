'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

// Page numbers to show: always the first and last page, the current page and
// its neighbours, with '…' for the gaps (e.g. 1 … 4 5 6 … 12).
function pageItems(page: number, totalPages: number): (number | '…')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const items: (number | '…')[] = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(totalPages - 1, page + 1);
  if (from > 2) items.push('…');
  for (let p = from; p <= to; p++) items.push(p);
  if (to < totalPages - 1) items.push('…');
  items.push(totalPages);
  return items;
}

export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  label = 'items',
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  label?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  const btn =
    'inline-flex h-10 min-w-[40px] items-center justify-center rounded-lg border px-3 text-sm font-medium transition-colors ' +
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ' +
    'disabled:cursor-not-allowed disabled:opacity-50';
  const idle = 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50';

  return (
    <nav className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between" aria-label="Pagination">
      <p className="text-sm text-slate-500">
        Showing <span className="font-medium text-slate-700">{first}–{last}</span> of{' '}
        <span className="font-medium text-slate-700">{total}</span> {label}
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button type="button" className={`${btn} ${idle}`} onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
            <ChevronLeft className="h-4 w-4" />
          </button>
          {/* Page numbers on tablet/desktop; "Page x of y" on phones */}
          <span className="px-2 text-sm text-slate-600 sm:hidden">
            Page {page} of {totalPages}
          </span>
          <div className="hidden items-center gap-1 sm:flex">
            {pageItems(page, totalPages).map((item, i) =>
              item === '…' ? (
                <span key={`gap-${i}`} className="px-1 text-slate-400">…</span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => onPageChange(item)}
                  aria-current={item === page ? 'page' : undefined}
                  className={`${btn} ${item === page ? 'border-brand-600 bg-brand-600 text-white' : idle}`}
                >
                  {item}
                </button>
              )
            )}
          </div>
          <button type="button" className={`${btn} ${idle}`} onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} aria-label="Next page">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </nav>
  );
}
