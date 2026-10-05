import { registerServiceCenterSchema, type RegisterServiceCenterInput } from '@ham/shared';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { useAuthMutation } from '../auth/useAuth';
import { fieldErrorsOf } from '../lib/api';
import { useBrands, useCategories } from '../lib/queries';
import { validate } from '../lib/form';
import { FormError } from '../ui/Alert';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ChipSelect } from '../ui/ChipSelect';
import { Skeleton } from '../ui/Skeleton';
import { TextField } from '../ui/TextField';

function Section({ step, title, description, children }: { step: number; title: string; description: string; children: React.ReactNode }) {
  return (
    <Card className="animate-fade-up">
      <div className="mb-6 flex items-start gap-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-sm bg-accent font-mono text-sm font-medium">{step}</span>
        <div>
          <h2 className="text-[1.5rem] font-bold">{title}</h2>
          <p className="text-sm text-muted">{description}</p>
        </div>
      </div>
      {children}
    </Card>
  );
}

export function RegisterServiceCenterPage() {
  const categories = useCategories();
  const brands = useBrands();

  const [center, setCenter] = useState({ name: '', address: '', phone: '', email: '' });
  const [staff, setStaff] = useState({ name: '', email: '', phone: '', password: '' });
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [brandIds, setBrandIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const register = useAuthMutation<RegisterServiceCenterInput>('/auth/register/service-center');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = validate(registerServiceCenterSchema, { center, staff, categoryIds, brandIds });
    setErrors(result.errors ?? {});
    if (result.data) register.mutate(result.data, { onError: (err) => setErrors(fieldErrorsOf(err)) });
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 md:py-16">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">Home Appliance Manager</p>
      <h1 className="mt-2 text-[2.25rem] font-bold">Register your service center</h1>
      <p className="mt-2 max-w-[60ch] text-muted">
        Customers can send you service requests for the appliance types and brands you choose here.
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-6">
        <FormError message={register.error?.message} />

        <Section step={1} title="Center details" description="Shown to customers when they choose a service center.">
          <div className="grid gap-5 md:grid-cols-2">
            <TextField label="Center name" value={center.name} onChange={(e) => setCenter({ ...center, name: e.target.value })} error={errors['center.name']} className="md:col-span-2" />
            <TextField label="Address" autoComplete="street-address" value={center.address} onChange={(e) => setCenter({ ...center, address: e.target.value })} error={errors['center.address']} className="md:col-span-2" />
            <TextField label="Phone" type="tel" value={center.phone} onChange={(e) => setCenter({ ...center, phone: e.target.value })} error={errors['center.phone']} />
            <TextField label="Email" type="email" value={center.email} onChange={(e) => setCenter({ ...center, email: e.target.value })} error={errors['center.email']} />
          </div>
        </Section>

        <Section step={2} title="What you service" description="Pick every appliance type and brand your center supports.">
          {categories.isPending || brands.isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-4/5" />
              <Skeleton className="h-9 w-3/5" />
            </div>
          ) : categories.isError || brands.isError ? (
            <FormError message="Could not load the list of categories and brands. Refresh the page to try again." />
          ) : (
            <div className="space-y-8">
              <ChipSelect label="Appliance types" items={categories.data} selected={categoryIds} onChange={setCategoryIds} error={errors.categoryIds} />
              <ChipSelect label="Brands" items={brands.data} selected={brandIds} onChange={setBrandIds} error={errors.brandIds} />
            </div>
          )}
        </Section>

        <Section step={3} title="Your staff account" description="You will use this to sign in and manage requests. You can add technicians afterwards.">
          <div className="grid gap-5 md:grid-cols-2">
            <TextField label="Full name" autoComplete="name" value={staff.name} onChange={(e) => setStaff({ ...staff, name: e.target.value })} error={errors['staff.name']} />
            <TextField label="Phone (optional)" type="tel" autoComplete="tel" value={staff.phone} onChange={(e) => setStaff({ ...staff, phone: e.target.value })} error={errors['staff.phone']} />
            <TextField label="Email" type="email" autoComplete="email" value={staff.email} onChange={(e) => setStaff({ ...staff, email: e.target.value })} error={errors['staff.email']} />
            <TextField label="Password" type="password" autoComplete="new-password" hint="At least 8 characters" value={staff.password} onChange={(e) => setStaff({ ...staff, password: e.target.value })} error={errors['staff.password']} />
          </div>
        </Section>

        <div className="flex flex-col-reverse items-center gap-4 sm:flex-row sm:justify-between">
          <Link to="/register" className="text-sm text-muted underline decoration-accent-strong underline-offset-4">
            Back
          </Link>
          <Button type="submit" className="w-full sm:w-auto" loading={register.isPending}>
            Register service center
          </Button>
        </div>
      </form>
    </div>
  );
}
