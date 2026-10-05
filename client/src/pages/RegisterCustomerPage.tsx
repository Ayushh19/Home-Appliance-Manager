import { registerCustomerSchema, type RegisterCustomerInput } from '@ham/shared';
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

export function RegisterCustomerPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const register = useAuthMutation<RegisterCustomerInput>('/auth/register/customer');
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = validate(registerCustomerSchema, form);
    setErrors(result.errors ?? {});
    if (result.data) register.mutate(result.data, { onError: (err) => setErrors(fieldErrorsOf(err)) });
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="After signing up you can add your home and the appliances in it."
    >
      <Card className="mx-auto w-full max-w-md">
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <FormError message={register.error?.message} />
          <TextField label="Full name" autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} />
          <TextField label="Email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />
          <TextField
            label="Phone (optional)"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={set('phone')}
            error={errors.phone}
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="new-password"
            hint="At least 8 characters"
            value={form.password}
            onChange={set('password')}
            error={errors.password}
          />
          <Button type="submit" className="w-full" loading={register.isPending}>
            Create account
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">
          <Link to="/register" className="underline decoration-accent-strong underline-offset-4">
            Back
          </Link>
        </p>
      </Card>
    </AuthLayout>
  );
}
