import { ASSET_STATUS_LABELS, ASSET_STATUSES, type AssetStatus } from '@ham/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { keys } from '../../lib/queries';
import { FormError } from '../../ui/Alert';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';

const DESCRIPTIONS: Record<AssetStatus, string> = {
  active: 'Still in use.',
  retired: 'No longer in use.',
  replaced: 'Replaced by a newer one.',
};

export function StatusModal({
  open,
  onClose,
  assetId,
  current,
}: {
  open: boolean;
  onClose: () => void;
  assetId: string;
  current: AssetStatus;
}) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AssetStatus>(current);
  useEffect(() => {
    if (open) setStatus(current);
  }, [open, current]);

  const save = useMutation({
    mutationFn: () => api(`/assets/${assetId}/status`, { method: 'PUT', body: { status } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.asset(assetId) });
      queryClient.invalidateQueries({ queryKey: keys.reminders });
      queryClient.invalidateQueries({ queryKey: keys.homes });
      onClose();
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="Change status">
      <p className="mb-5 text-sm text-muted">
        Retired and replaced assets keep all their details, warranties and documents.
      </p>
      <FormError message={save.error?.message} />
      <fieldset className="space-y-3">
        <legend className="sr-only">Status</legend>
        {ASSET_STATUSES.map((s) => (
          <label
            key={s}
            className={
              'flex cursor-pointer items-center gap-3 rounded-sm px-4 py-3 transition-[box-shadow,background-color] duration-200 ' +
              'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent-strong ' +
              (status === s ? 'bg-accent shadow-neu-inset' : 'bg-surface shadow-neu-sm hover:bg-surface-raised')
            }
          >
            <input type="radio" name="status" value={s} checked={status === s} onChange={() => setStatus(s)} className="accent-accent-strong" />
            <span>
              <span className="block font-medium">{ASSET_STATUS_LABELS[s]}</span>
              <span className="block text-sm text-muted">{DESCRIPTIONS[s]}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={() => save.mutate()} loading={save.isPending} disabled={status === current}>
          Save status
        </Button>
      </div>
    </Modal>
  );
}
