import { homeSchema, type HomeInput } from '@ham/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';
import { api, fieldErrorsOf } from '../../lib/api';
import { validate } from '../../lib/form';
import { keys } from '../../lib/queries';
import { FormError } from '../../ui/Alert';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { TextField } from '../../ui/TextField';

/** Add a home, or edit one when `home` is given. */
export function HomeFormModal({
  open,
  onClose,
  home,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  home?: { id: string; name: string; address: string };
  onSaved?: (home: { id: string }) => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<HomeInput>({ name: '', address: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm({ name: home?.name ?? '', address: home?.address ?? '' });
      setErrors({});
    }
  }, [open, home]);

  const save = useMutation({
    mutationFn: (input: HomeInput) =>
      home
        ? api<{ id: string }>(`/homes/${home.id}`, { method: 'PATCH', body: input })
        : api<{ id: string }>('/homes', { method: 'POST', body: input }),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: keys.homes });
      onSaved?.(saved);
      onClose();
    },
    onError: (err) => setErrors(fieldErrorsOf(err)),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = validate(homeSchema, form);
    setErrors(result.errors ?? {});
    if (result.data) save.mutate(result.data);
  };

  return (
    <Modal open={open} onClose={onClose} title={home ? 'Edit home' : 'Add a home'}>
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <FormError message={save.error?.message} />
        <TextField
          label="Name"
          placeholder="e.g. Baner apartment"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={errors.name}
          autoFocus
        />
        <TextField
          label="Address"
          autoComplete="street-address"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          error={errors.address}
        />
        <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={save.isPending}>
            {home ? 'Save changes' : 'Add home'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
