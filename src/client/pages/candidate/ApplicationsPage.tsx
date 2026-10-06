'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useNavigate } from '@/client/lib/navigation';
import { FileText, Search } from 'lucide-react';
import { applicationsApi } from '../../services/applications';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingState from '../../components/ui/LoadingState';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/ui/StatusBadge';

export default function ApplicationsPage() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    applicationsApi
      .listMine()
      .then((data) => setApplications(data.applications))
      .catch((err) => setError(err.message));
  };

  useEffect(load, []);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!applications) return <LoadingState />;

  if (applications.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No applications yet"
        description="Browse open jobs and apply to get started."
        action={
          <Link href="/candidate/jobs">
            <Button>
              <Search className="h-4 w-4" /> Find jobs
            </Button>
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-slate-900">My applications</h2>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Job</th>
              <th className="px-5 py-3">Company</th>
              <th className="px-5 py-3">Applied</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {applications.map((app) => (
              <tr
                key={app.id}
                onClick={() => navigate(`/candidate/applications/${app.id}`)}
                role="link"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/candidate/applications/${app.id}`);
                  }
                }}
                className="cursor-pointer hover:bg-slate-50 focus:outline-none focus-visible:bg-slate-50"
              >
                <td className="px-5 py-3">
                  <span className="font-medium text-slate-900">{app.job.title}</span>
                </td>
                <td className="px-5 py-3 text-slate-500">{app.job.company.name}</td>
                <td className="px-5 py-3 text-slate-500">{new Date(app.createdAt).toLocaleDateString()}</td>
                <td className="px-5 py-3">
                  <StatusBadge status={app.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
