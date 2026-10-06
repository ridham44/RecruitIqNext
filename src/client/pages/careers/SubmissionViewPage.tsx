'use client';

import { useEffect, useState } from 'react';
import { useParams } from '@/client/lib/navigation';
import { FileText, Download, CircleAlert } from 'lucide-react';
import { submissionsApi } from '../../services/submissions';
import CareersShell from './CareersShell';
import SubmissionPackage from '../../components/SubmissionPackage';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingState from '../../components/ui/LoadingState';

// Build plan P7 (§13) — /submission/:token: the read-only candidate package
// a client HR person receives by email (no login). Build plan P8 moved the
// package itself into components/SubmissionPackage.jsx so the logged-in
// client portal shows exactly the same thing.
export default function SubmissionViewPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    submissionsApi
      .viewPublic(token)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [token]);

  if (error) {
    return (
      <CareersShell narrow>
        <Card className="p-6 text-center">
          <CircleAlert className="mx-auto mb-3 h-10 w-10 text-slate-400" />
          <p className="text-sm text-slate-600">{error}</p>
        </Card>
      </CareersShell>
    );
  }
  if (!data) {
    return (
      <CareersShell narrow>
        <LoadingState label="Opening candidate…" />
      </CareersShell>
    );
  }

  const cvUrl = `/api/v1/public/submissions/${token}/cv`;

  return (
    <CareersShell company={{ name: data.snapshot.recruitmentCompany.name }}>
      <SubmissionPackage
        snapshot={data.snapshot}
        cvActions={
          <>
            <a href={cvUrl} target="_blank" rel="noreferrer">
              <Button variant="secondary" className="w-full sm:w-auto">
                <FileText className="h-4 w-4" /> View CV
              </Button>
            </a>
            <a href={`${cvUrl}?download=1`}>
              <Button variant="secondary" className="w-full sm:w-auto">
                <Download className="h-4 w-4" /> Download
              </Button>
            </a>
          </>
        }
        footer={
          <p className="mt-6 text-center text-xs text-slate-400">
            Shared with {data.recipientName} on {new Date(data.submittedAt).toLocaleDateString()} · This link is private — please don't
            forward it.
          </p>
        }
      />
    </CareersShell>
  );
}
