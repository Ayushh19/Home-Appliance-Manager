import { daysBetween, REMINDER_LEAD_DAYS, type MaintenanceSchedule } from '@ham/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { api } from '../../lib/api';
import { formatDate, todayIso } from '../../lib/format';
import { keys } from '../../lib/queries';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { ConfirmModal } from '../../ui/ConfirmModal';
import { ScheduleFormModal } from './ScheduleFormModal';

const iconButton =
  'grid size-9 place-items-center rounded-sm text-muted transition-colors duration-200 hover:bg-surface-raised hover:text-ink';

function intervalLabel(months: number) {
  if (months === 12) return 'Every year';
  if (months % 12 === 0) return `Every ${months / 12} years`;
  return months === 1 ? 'Every month' : `Every ${months} months`;
}

function DueBadge({ nextDueDate }: { nextDueDate: string }) {
  const days = daysBetween(todayIso(), nextDueDate);
  if (days < 0) return <Badge tone="blush">Overdue by {-days} {-days === 1 ? 'day' : 'days'}</Badge>;
  if (days === 0) return <Badge tone="blush">Due today</Badge>;
  // Same window as the maintenance reminder (docs/REMINDERS.md).
  if (days <= REMINDER_LEAD_DAYS.maintenance_due) return <Badge tone="accent">Due in {days} {days === 1 ? 'day' : 'days'}</Badge>;
  return null;
}

export function MaintenanceSection({ assetId, schedules }: { assetId: string; schedules: MaintenanceSchedule[] }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<MaintenanceSchedule | 'new' | null>(null);
  const [deleting, setDeleting] = useState<MaintenanceSchedule | null>(null);

  const remove = useMutation({
    mutationFn: (id: string) => api(`/maintenance-schedules/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.asset(assetId) });
      queryClient.invalidateQueries({ queryKey: keys.reminders });
      setDeleting(null);
    },
  });

  return (
    <Card className="animate-fade-up [animation-delay:80ms]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[1.5rem] font-bold">Maintenance</h2>
        <Button variant="ghost" className="px-3 py-2" onClick={() => setEditing('new')}>
          <Plus className="size-4" aria-hidden />
          Add
        </Button>
      </div>

      {schedules.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          No schedules yet. Add one for regular servicing, like an AC service every year or a purifier filter every 6 months.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {schedules.map((s) => (
            <li key={s.id} className="rounded-sm bg-surface p-4 shadow-neu-sm">
              <div className="flex items-start gap-3">
                <CalendarClock className="mt-0.5 size-5 shrink-0" aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="font-medium break-words">{s.title}</div>
                  <div className="mt-0.5 text-sm text-muted">{intervalLabel(s.intervalMonths)}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                    <span>Next: {formatDate(s.nextDueDate)}</span>
                    <DueBadge nextDueDate={s.nextDueDate} />
                  </div>
                </div>
                <div className="-mr-2 -mt-1 flex">
                  <button type="button" className={iconButton} aria-label={`Edit ${s.title}`} onClick={() => setEditing(s)}>
                    <Pencil className="size-4" aria-hidden />
                  </button>
                  <button type="button" className={iconButton} aria-label={`Delete ${s.title}`} onClick={() => setDeleting(s)}>
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ScheduleFormModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        assetId={assetId}
        schedule={editing && editing !== 'new' ? editing : undefined}
      />
      <ConfirmModal
        open={deleting !== null}
        title="Delete schedule?"
        message={`"${deleting?.title}" will be removed and you won't get reminders for it.`}
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        onClose={() => setDeleting(null)}
      />
    </Card>
  );
}
