import type { Warranty } from '@ham/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { api } from '../../lib/api';
import { formatDate, todayIso } from '../../lib/format';
import { keys } from '../../lib/queries';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { ConfirmModal } from '../../ui/ConfirmModal';
import { WarrantyFormModal } from './WarrantyFormModal';

const iconButton =
  'grid size-9 place-items-center rounded-sm text-muted transition-colors duration-200 hover:bg-surface-raised hover:text-ink';

export function WarrantiesSection({
  assetId,
  warranties,
  purchaseDate,
}: {
  assetId: string;
  warranties: Warranty[];
  purchaseDate: string | null;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Warranty | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Warranty | null>(null);
  const today = todayIso();

  const remove = useMutation({
    mutationFn: (id: string) => api(`/warranties/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.asset(assetId) });
      queryClient.invalidateQueries({ queryKey: keys.reminders });
      setDeleting(null);
    },
  });

  return (
    <Card className="animate-fade-up [animation-delay:80ms]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[1.5rem] font-bold">Warranties</h2>
        <Button variant="ghost" className="px-3 py-2" onClick={() => setEditing('new')}>
          <Plus className="size-4" aria-hidden />
          Add
        </Button>
      </div>

      {warranties.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No warranties added. An asset can have more than one, such as a product warranty and a separate compressor or extended warranty.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {warranties.map((w) => {
            const valid = w.endDate >= today;
            return (
              <li key={w.id} className="rounded-sm bg-surface p-4 shadow-neu-sm">
                <div className="flex items-start gap-3">
                  <ShieldCheck className={`mt-0.5 size-5 shrink-0 ${valid ? '' : 'text-muted'}`} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={valid ? 'accent' : 'neutral'}>{valid ? 'Valid' : 'Expired'}</Badge>
                      <span className="text-sm">
                        {valid ? 'Until' : 'Ended'} {formatDate(w.endDate)}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted">
                      {formatDate(w.startDate)} – {formatDate(w.endDate)}
                    </div>
                    {w.details && <p className="mt-2 text-sm whitespace-pre-line">{w.details}</p>}
                  </div>
                  <div className="-mr-2 -mt-1 flex">
                    <button type="button" className={iconButton} aria-label="Edit warranty" onClick={() => setEditing(w)}>
                      <Pencil className="size-4" aria-hidden />
                    </button>
                    <button type="button" className={iconButton} aria-label="Delete warranty" onClick={() => setDeleting(w)}>
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <WarrantyFormModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        assetId={assetId}
        warranty={editing && editing !== 'new' ? editing : undefined}
        defaultStartDate={purchaseDate}
      />
      <ConfirmModal
        open={deleting !== null}
        title="Delete warranty?"
        message="This warranty will be removed from the asset."
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </Card>
  );
}
