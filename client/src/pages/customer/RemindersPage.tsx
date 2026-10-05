import { daysBetween, todayIso, type ReminderItem, assetLabel } from '@ham/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BellRing, CalendarClock, Check, ChevronRight, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { keys, useReminders } from '../../lib/queries';
import { FormError } from '../../ui/Alert';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { EmptyState } from '../../ui/EmptyState';
import { PageHeader } from '../../ui/PageHeader';
import { Skeleton } from '../../ui/Skeleton';

function relative(dueDate: string) {
  const days = daysBetween(todayIso(), dueDate);
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days > 0) return `in ${days} days`;
  return days === -1 ? 'yesterday' : `${-days} days ago`;
}

function ReminderRow({ reminder, index, onRead, marking }: { reminder: ReminderItem; index: number; onRead: () => void; marking: boolean }) {
  const { asset } = reminder;
  const warranty = reminder.type === 'warranty_expiry';
  const Icon = warranty ? ShieldAlert : CalendarClock;
  const overdue = daysBetween(todayIso(), reminder.dueDate) < 0;
  const assetName = assetLabel(asset);

  return (
    <li className="animate-fade-up" style={{ animationDelay: `${index * 80}ms` }}>
      <div className={`flex items-start gap-4 px-6 py-5 ${reminder.read ? '' : 'bg-surface-raised/60'}`}>
        <div className={`grid size-11 shrink-0 place-items-center rounded-sm ${reminder.read ? 'bg-surface text-muted' : 'bg-blush'}`}>
          <Icon className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={warranty ? 'neutral' : 'accent'}>{warranty ? 'Warranty' : 'Maintenance'}</Badge>
            {overdue && !warranty && <Badge tone="blush">Overdue</Badge>}
            {!reminder.read && <span className="size-2 rounded-full bg-accent-strong" aria-label="Unread" />}
          </div>
          <p className={`mt-1.5 ${reminder.read ? 'text-muted' : 'font-medium'}`}>
            {warranty ? (
              <>
                Warranty on your {assetName} {overdue ? 'ended' : 'ends'} {relative(reminder.dueDate)}
              </>
            ) : (
              <>
                {reminder.scheduleTitle} for your {assetName} {overdue ? 'was due' : 'is due'} {relative(reminder.dueDate)}
              </>
            )}
          </p>
          <p className="mt-0.5 text-sm text-muted">
            {formatDate(reminder.dueDate)} · {asset.homeName}
            {asset.model && (
              <>
                {' '}
                · <span className="font-mono text-xs">{asset.model}</span>
              </>
            )}
          </p>
          {warranty && !overdue && (
            <p className="mt-1.5 text-sm text-muted">If something is wrong with it, you may be able to get it repaired under warranty.</p>
          )}
          {reminder.warrantyDetails && <p className="mt-1 text-sm whitespace-pre-line text-muted">{reminder.warrantyDetails}</p>}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
          {!reminder.read && (
            <Button variant="ghost" className="px-3 py-2" onClick={onRead} loading={marking} aria-label="Mark as read">
              <Check className="size-4" aria-hidden />
              <span className="hidden sm:inline">Mark read</span>
            </Button>
          )}
          <Link
            to={`/app/assets/${asset.id}`}
            className="grid size-9 place-items-center rounded-sm text-muted transition-colors duration-200 hover:bg-surface-raised hover:text-ink"
            aria-label={`Open ${assetName}`}
          >
            <ChevronRight className="size-5" aria-hidden />
          </Link>
        </div>
      </div>
    </li>
  );
}

export function RemindersPage() {
  const queryClient = useQueryClient();
  const reminders = useReminders();
  const refresh = () => queryClient.invalidateQueries({ queryKey: keys.reminders });

  const markRead = useMutation({ mutationFn: (id: string) => api(`/reminders/${id}/read`, { method: 'POST' }), onSuccess: refresh });
  const markAll = useMutation({ mutationFn: () => api('/reminders/read-all', { method: 'POST' }), onSuccess: refresh });

  return (
    <>
      <PageHeader
        title="Reminders"
        subtitle="Warranties ending in the next 30 days and maintenance due in the next 7 days. They're also sent to your email."
        actions={
          reminders.data?.unreadCount ? (
            <Button variant="ghost" onClick={() => markAll.mutate()} loading={markAll.isPending}>
              <Check className="size-4" aria-hidden />
              Mark all read
            </Button>
          ) : undefined
        }
      />

      {reminders.isPending ? (
        <Skeleton className="h-48" />
      ) : reminders.isError ? (
        <FormError message="Could not load reminders." />
      ) : reminders.data.items.length === 0 ? (
        <Card className="animate-fade-up">
          <EmptyState
            icon={BellRing}
            title="Nothing coming up"
            description="Reminders appear here when a warranty is about to end or maintenance is due. Add warranties and maintenance schedules on each asset's page."
          />
        </Card>
      ) : (
        <Card padded={false} className="animate-fade-up overflow-hidden">
          <ul className="divide-y divide-line/70">
            {reminders.data.items.map((r, i) => (
              <ReminderRow
                key={r.id}
                reminder={r}
                index={i}
                onRead={() => markRead.mutate(r.id)}
                marking={markRead.isPending && markRead.variables === r.id}
              />
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
