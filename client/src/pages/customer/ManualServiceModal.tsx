import {
  manualServiceRecordSchema,
  SERVICE_TYPE_LABELS,
  SERVICE_TYPES,
  type MaintenanceSchedule,
  type ManualServiceRecordInput,
  type ServiceType,
} from '@ham/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';
import { api, fieldErrorsOf } from '../../lib/api';
import { todayIso } from '../../lib/format';
import { validate } from '../../lib/form';
import { keys } from '../../lib/queries';
import { FormError } from '../../ui/Alert';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { SelectField } from '../../ui/SelectField';
import { TextAreaField } from '../../ui/TextAreaField';
import { TextField } from '../../ui/TextField';

const EMPTY = {
  type: '' as ServiceType | '',
  maintenanceScheduleId: '',
  serviceDate: '',
  problem: '',
  workDone: '',
  partsReplaced: '',
  cost: '',
  performedBy: '',
};

/** Add a service done in the past or outside the app (docs/DECISIONS.md #6, #21). */
export function ManualServiceModal({
  open,
  onClose,
  assetId,
  schedules,
}: {
  open: boolean;
  onClose: () => void;
  assetId: string;
  schedules: MaintenanceSchedule[];
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setErrors({});
    }
  }, [open]);

  const save = useMutation({
    mutationFn: (input: ManualServiceRecordInput) => api(`/assets/${assetId}/service-records`, { method: 'POST', body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.asset(assetId) });
      queryClient.invalidateQueries({ queryKey: keys.reminders });
      onClose();
    },
    onError: (err) => setErrors(fieldErrorsOf(err)),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const input = { ...form, maintenanceScheduleId: form.type === 'maintenance' ? form.maintenanceScheduleId : '' };
    const result = validate(manualServiceRecordSchema, input);
    setErrors(result.errors ?? {});
    if (result.data) save.mutate(input as ManualServiceRecordInput);
  };

  return (
    <Modal open={open} onClose={onClose} title="Add a past service">
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <p className="text-sm text-muted">For services done before you used this app, or by someone outside it.</p>
        <FormError message={save.error?.message} />
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            label="Type"
            placeholder="Select"
            options={SERVICE_TYPES.map((t) => ({ value: t, label: SERVICE_TYPE_LABELS[t] }))}
            value={form.type}
            onChange={set('type')}
            error={errors.type}
          />
          <TextField label="Date" type="date" max={todayIso()} value={form.serviceDate} onChange={set('serviceDate')} error={errors.serviceDate} />
        </div>
        {form.type === 'maintenance' && schedules.length > 0 && (
          <SelectField
            label="Maintenance schedule (optional)"
            hint="The schedule's next due date moves forward if this service is its latest."
            placeholder="Not linked to a schedule"
            options={schedules.map((s) => ({ value: s.id, label: s.title }))}
            value={form.maintenanceScheduleId}
            onChange={set('maintenanceScheduleId')}
            error={errors.maintenanceScheduleId}
          />
        )}
        <TextAreaField label="Problem (optional)" rows={2} value={form.problem} onChange={set('problem')} error={errors.problem} />
        <TextAreaField label="Work done" rows={2} placeholder="e.g. Gas refilled, filters cleaned" value={form.workDone} onChange={set('workDone')} error={errors.workDone} />
        <TextField label="Parts replaced (optional)" value={form.partsReplaced} onChange={set('partsReplaced')} error={errors.partsReplaced} />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Cost in ₹ (optional)"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={form.cost}
            onChange={set('cost')}
            error={errors.cost}
          />
          <TextField label="Done by (optional)" placeholder="e.g. Local repair shop" value={form.performedBy} onChange={set('performedBy')} error={errors.performedBy} />
        </div>
        <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={save.isPending}>
            Add service
          </Button>
        </div>
      </form>
    </Modal>
  );
}
