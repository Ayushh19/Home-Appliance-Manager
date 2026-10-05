import { serviceCenterProfileSchema, type ServiceCenterProfile, type ServiceCenterProfileInput } from '@ham/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DoorClosed, DoorOpen } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { ME_KEY } from '../../auth/useAuth';
import { api, fieldErrorsOf } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { validate } from '../../lib/form';
import { keys, useBrands, useCategories, useCenterProfile } from '../../lib/queries';
import { FormError } from '../../ui/Alert';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { ChipSelect } from '../../ui/ChipSelect';
import { ConfirmModal } from '../../ui/ConfirmModal';
import { PageHeader } from '../../ui/PageHeader';
import { Skeleton } from '../../ui/Skeleton';
import { TextField } from '../../ui/TextField';

/** Saves the profile into the cache and refreshes the signed-in user (center name and open/closed state). */
function useProfileMutation<I>(fn: (input: I) => Promise<ServiceCenterProfile>, onDone?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (profile) => {
      queryClient.setQueryData(keys.centerProfile, profile);
      queryClient.invalidateQueries({ queryKey: ME_KEY });
      onDone?.();
    },
    // e.g. closing refused because a request just arrived: reload so the open-request count is current.
    onError: () => queryClient.invalidateQueries({ queryKey: keys.centerProfile }),
  });
}

function DetailsForm({ profile }: { profile: ServiceCenterProfile }) {
  const categories = useCategories();
  const brands = useBrands();
  const [center, setCenter] = useState({ name: '', address: '', phone: '', email: '' });
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [brandIds, setBrandIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setCenter({ name: profile.name, address: profile.address, phone: profile.phone, email: profile.email });
    setCategoryIds(profile.categoryIds);
    setBrandIds(profile.brandIds);
  }, [profile]);

  const save = useProfileMutation<ServiceCenterProfileInput>(
    (input) => api<ServiceCenterProfile>('/center/profile', { method: 'PATCH', body: input }),
    () => setSaved(true),
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSaved(false);
    const result = validate(serviceCenterProfileSchema, { center, categoryIds, brandIds });
    setErrors(result.errors ?? {});
    if (result.data) save.mutate(result.data, { onError: (err) => setErrors(fieldErrorsOf(err)) });
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <Card className="animate-fade-up">
        <h2 className="mb-1 text-[1.5rem] font-bold">Details</h2>
        <p className="mb-6 text-sm text-muted">Shown to customers when they choose a service center.</p>
        <div className="grid gap-5 md:grid-cols-2">
          <TextField label="Center name" className="md:col-span-2" value={center.name} onChange={(e) => setCenter({ ...center, name: e.target.value })} error={errors['center.name']} />
          <TextField label="Address" className="md:col-span-2" value={center.address} onChange={(e) => setCenter({ ...center, address: e.target.value })} error={errors['center.address']} />
          <TextField label="Phone" type="tel" value={center.phone} onChange={(e) => setCenter({ ...center, phone: e.target.value })} error={errors['center.phone']} />
          <TextField label="Email" type="email" value={center.email} onChange={(e) => setCenter({ ...center, email: e.target.value })} error={errors['center.email']} />
        </div>
      </Card>

      <Card className="animate-fade-up [animation-delay:80ms]">
        <h2 className="mb-1 text-[1.5rem] font-bold">What you service</h2>
        <p className="mb-6 text-sm text-muted">
          Customers can only send you requests for these. Removing one doesn't affect requests you already have.
        </p>
        {categories.isPending || brands.isPending ? (
          <Skeleton className="h-40" />
        ) : categories.isError || brands.isError ? (
          <FormError message="Could not load the list of types and brands." />
        ) : (
          <div className="space-y-8">
            <ChipSelect label="Appliance types" items={categories.data} selected={categoryIds} onChange={setCategoryIds} error={errors.categoryIds} />
            <ChipSelect label="Brands" items={brands.data} selected={brandIds} onChange={setBrandIds} error={errors.brandIds} />
          </div>
        )}
      </Card>

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
        <FormError message={save.error && !Object.keys(fieldErrorsOf(save.error)).length ? save.error.message : undefined} />
        {saved && (
          <p role="status" className="text-sm text-muted">
            Changes saved.
          </p>
        )}
        <Button type="submit" loading={save.isPending}>
          Save changes
        </Button>
      </div>
    </form>
  );
}

function OpenClosedCard({ profile }: { profile: ServiceCenterProfile }) {
  const [confirming, setConfirming] = useState(false);
  const close = useProfileMutation(() => api<ServiceCenterProfile>('/center/close', { method: 'POST' }), () => setConfirming(false));
  const reopen = useProfileMutation(() => api<ServiceCenterProfile>('/center/reopen', { method: 'POST' }));
  const closed = profile.closedAt !== null;
  const blocked = profile.openRequestCount > 0;

  return (
    <Card className="animate-fade-up [animation-delay:80ms]">
      <h2 className="mb-1 flex items-center gap-2 text-[1.5rem] font-bold">
        {closed ? <DoorClosed className="size-5" aria-hidden /> : <DoorOpen className="size-5" aria-hidden />}
        {closed ? 'Center is closed' : 'Center is open'}
      </h2>
      {closed ? (
        <>
          <p className="mb-5 text-sm text-muted">
            Closed since {formatDate(profile.closedAt)}. Customers can't choose your center and your technicians can't sign in. All past
            requests are kept.
          </p>
          <FormError message={reopen.error?.message} />
          <Button className="w-full" onClick={() => reopen.mutate(undefined)} loading={reopen.isPending}>
            Reopen center
          </Button>
        </>
      ) : (
        <>
          <p className="mb-5 text-sm text-muted">
            Closing hides your center from customers and stops your technicians from signing in. Past requests are kept, and you can
            reopen at any time.
          </p>
          {blocked && (
            <p className="mb-4 rounded-sm bg-blush px-4 py-3 text-sm">
              You have <span className="font-mono font-medium">{profile.openRequestCount}</span> open{' '}
              {profile.openRequestCount === 1 ? 'request' : 'requests'}. Finish or reject{' '}
              {profile.openRequestCount === 1 ? 'it' : 'them'} before closing.
            </p>
          )}
          <FormError message={close.error?.message} />
          <Button variant="ghost" className="w-full" disabled={blocked} onClick={() => setConfirming(true)}>
            Close center
          </Button>
        </>
      )}
      <ConfirmModal
        open={confirming}
        title="Close your center?"
        message="Customers won't be able to send you requests, and your technicians won't be able to sign in until you reopen."
        confirmLabel="Close center"
        loading={close.isPending}
        onConfirm={() => close.mutate(undefined, { onError: () => setConfirming(false) })}
        onClose={() => setConfirming(false)}
      />
    </Card>
  );
}

export function CenterSettingsPage() {
  const profile = useCenterProfile();
  return (
    <>
      <PageHeader title="Center" subtitle="Your center's details, what it services, and whether it's open." />
      {profile.isPending ? (
        <Skeleton className="h-96" />
      ) : profile.isError ? (
        <FormError message="Could not load your center." />
      ) : (
        <div className="grid items-start gap-6 md:grid-cols-[7fr_5fr]">
          <DetailsForm profile={profile.data} />
          <OpenClosedCard profile={profile.data} />
        </div>
      )}
    </>
  );
}
