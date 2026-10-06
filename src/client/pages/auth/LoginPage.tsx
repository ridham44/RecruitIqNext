'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useNavigate, useSearchParams } from '@/client/lib/navigation';
import AuthShell from './AuthShell';
import { useAuth } from '../../hooks/useAuth';
import FormField, { inputClass } from '../../components/ui/FormField';
import PasswordInput from '../../components/ui/PasswordInput';
import Button from '../../components/ui/Button';
import { homePathForRole } from '../../utils/homePath';
import { loginSchema } from '../../../shared/schemas/auth.schema';
import { checkForm } from '../../../shared/schemas/common';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  // const [form, setForm] = useState({ email: '', password: '' });
  // "Start here" demo page links to /auth/login?email=… to pre-fill the email.
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ email: searchParams.get('email') || '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, any>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { data, errors } = checkForm(loginSchema, form);
    setFieldErrors(errors);
    if (!data) return setError('Please fix the highlighted fields');

    setLoading(true);
    try {
      const user = await login(data.email, data.password);
      // navigate(user.role === 'COMPANY' ? '/company/dashboard' : '/candidate/dashboard');
      navigate(homePathForRole(user.role));
    } catch (err) {
      setFieldErrors(err.fields || {});
      setError(Object.keys(err.fields || {}).length ? 'Please fix the highlighted fields' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to your RecruitIQ account">
      <form onSubmit={handleSubmit} noValidate>
        <FormField label="Email" error={fieldErrors.email}>
          <input
            type="email"
            inputMode="email"
            required
            className={`${inputClass} min-h-[44px]`}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            autoComplete="email"
            maxLength={254}
            placeholder="you@example.com"
          />
        </FormField>
        <FormField label="Password" error={fieldErrors.password}>
          <PasswordInput
            required
            className="min-h-[44px]"
            autoComplete="current-password"
            maxLength={200}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Enter your password"
          />
        </FormField>
        {/* Forgot password */}
        <div className="-mt-2 mb-4 text-right">
          <Link
            href="/auth/forgot-password"
            className="inline-flex min-h-[44px] items-center text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Forgot password?
          </Link>
        </div>
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" loading={loading}>
          Log in
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        {/* No sign-up: agencies are added by the Portal Admin. */}
        Agency accounts are set up by the RecruitIQ team. Candidates: use the link your recruitment agency sent you.
      </p>
    </AuthShell>
  );
}
