import { warrantySchema, type Warranty, type WarrantyInput } from '@ham/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';
import { api, fieldErrorsOf } from '../../lib/api';
import { validate } from '../../lib/form';
import { keys } from '../../lib/queries';
import { FormError } from '../../ui/Alert';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { TextAreaField } from '../../ui/TextAreaField';
import { TextField } from '../../ui/TextField';

/** Add a warranty to an asset, or edit one when `warranty` is given. */
export function WarrantyFormModal({
  open,
  onClose,
  assetId,
  warranty,
  defaultStartDate,
}: {
  open: boolean;
  onClose: () => void;
  assetId: string;
  warranty?: Warranty;
  defaultStartDate?: string | null;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ startDate: '', endDate: '', details: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm({
        startDate: warranty?.startDate ?? defaultStartDate ?? '',
        endDate: warranty?.endDate ?? '',
        details: warranty?.details ?? '',
      });
      setErrors({});
    }
  }, [open, warranty, defaultStartDate]);

  const save = useMutation({
    mutationFn: (input: WarrantyInput) =>
      warranty
        ? api(`/warranties/${warranty.id}`, { method: 'PATCH', body: input })
        : api(`/assets/${assetId}/warranties`, { method: 'POST', body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.asset(assetId) });
      queryClient.invalidateQueries({ queryKey: keys.reminders });
      onClose();
    },
    onError: (err) => setErrors(fieldErrorsOf(err)),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = validate(warrantySchema, form);
    setErrors(result.errors ?? {});
    if (result.data) save.mutate(form);
  };

  return (
    <Modal open={open} onClose={onClose} title={warranty ? 'Edit warranty' : 'Add warranty'}>
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <FormError message={save.error?.message} />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Starts on"
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            error={errors.startDate}
          />
          <TextField
            label="Ends on"
            type="date"
            min={form.startDate || undefined}
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            error={errors.endDate}
          />
        </div>
        <TextAreaField
          label="Details (optional)"
          placeholder="What it covers, who provides it, claim number…"
          value={form.details}
          onChange={(e) => setForm({ ...form, details: e.target.value })}
          error={errors.details}
        />
        <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={save.isPending}>
            {warranty ? 'Save changes' : 'Add warranty'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
