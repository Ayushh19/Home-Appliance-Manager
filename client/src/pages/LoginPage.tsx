import { loginSchema, type LoginInput } from '@ham/shared';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { useAuthMutation } from '../auth/useAuth';
import { AuthLayout } from '../layouts/AuthLayout';
import { fieldErrorsOf } from '../lib/api';
import { validate } from '../lib/form';
import { FormError } from '../ui/Alert';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { TextField } from '../ui/TextField';

export function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const login = useAuthMutation<LoginInput>('/auth/login');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = validate(loginSchema, form);
    setErrors(result.errors ?? {});
    if (result.data) login.mutate(result.data, { onError: (err) => setErrors(fieldErrorsOf(err)) });
  };

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Homeowners, service center staff and technicians all sign in here."
    >
      <Card className="mx-auto w-full max-w-md">
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <FormError message={login.error?.message} />
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={errors.email}
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={errors.password}
          />
          <Button type="submit" className="w-full" loading={login.isPending}>
            Sign in
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">
          New here?{' '}
          <Link to="/register" className="font-medium text-ink underline decoration-accent-strong underline-offset-4">
            Create an account
          </Link>
        </p>
      </Card>
    </AuthLayout>
  );
}
