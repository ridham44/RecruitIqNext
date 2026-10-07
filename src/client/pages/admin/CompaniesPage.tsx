'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Building2, Search } from 'lucide-react';
import { adminApi } from '../../services/admin';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingState from '../../components/ui/LoadingState';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination from '../../components/ui/Pagination';
import { inputClass } from '../../components/ui/FormField';

const formatDate = (d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
const PAGE_SIZE = 10;

// Build plan P1 — every Recruitment Company on the platform.
export default function CompaniesPage() {
  const [companies, setCompanies] = useState(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const load = (params = { q, status }) => {
    setError('');
    adminApi
      .listCompanies(params)
      .then((data) => setCompanies(data.companies))
      .catch((err) => setError(err.message));
  };

  // Debounced search so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => load({ q, status }), 250);
    setPage(1);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status]);

  const filtered = Boolean(q || status);
  const totalPages = companies ? Math.max(1, Math.ceil(companies.length / PAGE_SIZE)) : 1;
  const currentPage = Math.min(page, totalPages);
  const pageCompanies = companies ? companies.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE) : [];
  const goToPage = (p) => {
    setPage(Math.min(Math.max(1, p), totalPages));
    document.getElementById('agencies-list')?.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Agencies</h2>
          <p className="text-sm text-slate-500">Recruitment agencies using RecruitIQ</p>
        </div>
        <Link href="/admin/companies/new" className="sm:shrink-0">
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4" /> Add agency
          </Button>
        </Link>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            className={`${inputClass} min-h-[44px] pl-9`}
            placeholder="Search by agency or agency owner email"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          className={`${inputClass} min-h-[44px] sm:w-44`}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {error && <ErrorState message={error} onRetry={() => load()} />}
      {!error && !companies && <LoadingState />}
      {companies && companies.length === 0 && (
        <EmptyState
          icon={Building2}
          title={filtered ? 'No agencies match' : 'No agencies yet'}
          description={filtered ? 'Try a different search or status.' : 'Add the first recruitment agency to get started.'}
          action={
            !filtered && (
              <Link href="/admin/companies/new">
                <Button>Add agency</Button>
              </Link>
            )
          }
        />
      )}

      {companies && companies.length > 0 && (
        <>
          {/* Mobile: cards */}
          <div className="space-y-3 md:hidden">
            {pageCompanies.map((c) => (
              <Link key={c.id} href={`/admin/companies/${c.id}`} className="block">
                <Card className="p-4 active:bg-slate-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{c.name}</p>
                      <p className="truncate text-sm text-slate-500">{c.owner?.email}</p>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>{c.jobCount} jobs</span>
                    <span>{c.applicationCount} applications</span>
                    <span>Added {formatDate(c.createdAt)}</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {/* Tablet/desktop: table */}
          {/* Scrolls inside the card (both directions) with the header kept in view */}
          <Card id="agencies-list" className="table-scroll hidden md:block">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 shadow-[0_1px_0_0_theme(colors.slate.200)]">
                <tr>
                  <th className="px-5 py-3">Agency</th>
                  <th className="px-5 py-3">Agency owner</th>
                  <th className="px-5 py-3">Jobs</th>
                  <th className="px-5 py-3">Applications</th>
                  <th className="px-5 py-3">Added</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageCompanies.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link href={`/admin/companies/${c.id}`} className="font-medium text-slate-900 hover:text-brand-600">
                        {c.name}
                      </Link>
                      {c.createdByAdminId === null && <p className="text-xs text-slate-400">Self-registered</p>}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{c.owner?.email}</td>
                    <td className="px-5 py-3 text-slate-600">{c.jobCount}</td>
                    <td className="px-5 py-3 text-slate-600">{c.applicationCount}</td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(c.createdAt)}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Pagination page={currentPage} pageSize={PAGE_SIZE} total={companies.length} onPageChange={goToPage} label="agencies" />
        </>
      )}
    </div>
  );
}
