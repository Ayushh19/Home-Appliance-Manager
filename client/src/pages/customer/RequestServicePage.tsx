import { createServiceRequestSchema, SERVICE_TYPE_LABELS, SERVICE_TYPES, type CreateServiceRequestInput, type ServiceType, assetLabel } from '@ham/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Store } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { api, fieldErrorsOf } from '../../lib/api';
import { validate } from '../../lib/form';
import { keys, useAsset, useServiceCenters } from '../../lib/queries';
import { CenterPicker } from '../../requests/CenterPicker';
import { useRequestOrigin, type RequestSent } from '../../requests/requestOrigin';
import { FormError } from '../../ui/Alert';
import { Button, buttonClass } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { EmptyState } from '../../ui/EmptyState';
import { PageHeader } from '../../ui/PageHeader';
import { SelectField } from '../../ui/SelectField';
import { Skeleton } from '../../ui/Skeleton';
import { TextAreaField } from '../../ui/TextAreaField';

export function RequestServicePage() {
  const { assetId = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const asset = useAsset(assetId);
  const from = useRequestOrigin();
  const backTo = from?.to ?? `/app/assets/${assetId}`;
  const centers = useServiceCenters(assetId);

  const [form, setForm] = useState<{ type: ServiceType | ''; maintenanceScheduleId: string; description: string; serviceCenterId: string }>({
    type: '',
    maintenanceScheduleId: '',
    description: '',
    serviceCenterId: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const create = useMutation({
    mutationFn: (input: CreateServiceRequestInput) =>
      api<{ id: string }>(`/assets/${assetId}/service-requests`, { method: 'POST', body: input }),
    onSuccess: ({ id }) => {
      queryClient.invalidateQueries({ queryKey: keys.serviceRequests });
      queryClient.invalidateQueries({ queryKey: keys.asset(assetId) });
      queryClient.invalidateQueries({ queryKey: keys.dashboard });
      // Started from the overview or Service requests page: go back there with a confirmation.
      if (from) navigate(from.to, { state: { requestSent: { requestId: id, assetLabel: assetLabel(asset.data!) } satisfies RequestSent } });
      else navigate(`/app/requests/${id}`);
    },
    onError: (err) => setErrors(fieldErrorsOf(err)),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const input = { ...form, maintenanceScheduleId: form.type === 'maintenance' ? form.maintenanceScheduleId : '' };
    const result = validate(createServiceRequestSchema, input);
    setErrors(result.errors ?? {});
    if (result.data) create.mutate(input as CreateServiceRequestInput);
  };

  if (asset.isError) return <FormError message={asset.error.message} />;
  const a = asset.data;
  const schedules = a?.maintenanceSchedules ?? [];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        back={from ?? { to: `/app/assets/${assetId}`, label: a ? assetLabel(a) : 'Back' }}
        title="Request service"
        subtitle="Describe the problem and choose a service center. You can follow the request's progress here."
      />

      {asset.isPending || centers.isPending ? (
        <Skeleton className="h-96" />
      ) : a!.status !== 'active' ? (
        <FormError message="Service can only be requested for assets that are in use." />
      ) : centers.isError ? (
        <FormError message="Could not load service centers." />
      ) : centers.data.length === 0 ? (
        <Card className="animate-fade-up">
          <EmptyState
            icon={Store}
            title="No service centers yet"
            description={`No registered service center supports ${a!.brand} ${a!.category.toLowerCase()} yet.`}
            action={
              <Link to={backTo} className={buttonClass('ghost')}>
                Back to asset
              </Link>
            }
          />
        </Card>
      ) : (
        <Card className="animate-fade-up">
          <form onSubmit={onSubmit} noValidate className="space-y-6">
            <FormError message={create.error?.message} />

            <fieldset>
              <legend className="mb-2 text-sm font-medium tracking-wide">What kind of service?</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {SERVICE_TYPES.map((t) => {
                  const on = form.type === t;
                  return (
                    <label
                      key={t}
                      className={
                        'flex cursor-pointer flex-col rounded-sm px-4 py-3 transition-[box-shadow,background-color] duration-200 ' +
                        'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent-strong ' +
                        (on ? 'bg-accent shadow-neu-inset' : 'bg-surface shadow-neu-sm hover:bg-surface-raised')
                      }
                    >
                      <input type="radio" name="type" className="sr-only" checked={on} onChange={() => setForm({ ...form, type: t })} />
                      <span className="font-medium">{SERVICE_TYPE_LABELS[t]}</span>
                      <span className="text-sm text-muted">
                        {t === 'maintenance' ? 'Regular servicing, cleaning or check-up' : 'Something is broken or not working properly'}
                      </span>
                    </label>
                  );
                })}
              </div>
              {errors.type && <p className="mt-2 text-sm text-danger">{errors.type}</p>}
            </fieldset>

            {form.type === 'maintenance' && schedules.length > 0 && (
              <SelectField
                label="Which maintenance schedule is this for? (optional)"
                hint="Its next due date moves forward when the service is completed."
                placeholder="Not linked to a schedule"
                options={schedules.map((s) => ({ value: s.id, label: s.title }))}
                value={form.maintenanceScheduleId}
                onChange={(e) => setForm({ ...form, maintenanceScheduleId: e.target.value })}
                error={errors.maintenanceScheduleId}
              />
            )}

            <TextAreaField
              label="Describe the problem"
              rows={4}
              placeholder={form.type === 'repair' ? 'e.g. Not cooling since yesterday, making a rattling noise' : 'e.g. Yearly service, filter cleaning'}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              error={errors.description}
            />

            <CenterPicker
              centers={centers.data}
              value={form.serviceCenterId}
              onChange={(id) => setForm({ ...form, serviceCenterId: id })}
              error={errors.serviceCenterId}
            />

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link to={backTo} className={buttonClass('ghost')}>
                Cancel
              </Link>
              <Button type="submit" loading={create.isPending}>
                Send request
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
