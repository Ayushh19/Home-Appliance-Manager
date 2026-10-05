import { ASSET_STATUS_LABELS, REQUEST_STATUS_LABELS, SERVICE_TYPE_LABELS, todayIso, type AssetDetail } from '@ham/shared';
import { Archive, CalendarClock, ClipboardList, Plus, ShieldCheck, ShoppingBag, Wrench, type LucideIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { formatDate, formatMoney } from '../../lib/format';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { ManualServiceModal } from './ManualServiceModal';

interface Entry {
  key: string;
  /** "YYYY-MM-DD" (timestamps are cut to the day). */
  date: string;
  /** Orders entries on the same day: lower first in time. */
  order: number;
  icon: LucideIcon;
  title: ReactNode;
  body?: ReactNode;
  aside?: ReactNode;
}

const day = (iso: string) => iso.slice(0, 10);

/** Everything that happened to the asset, plus what's coming up (docs/DECISIONS.md #30). */
function buildEntries(a: AssetDetail): { upcoming: Entry[]; past: Entry[] } {
  const today = todayIso();
  const entries: Entry[] = [];

  if (a.purchaseDate) {
    entries.push({
      key: 'purchase',
      date: a.purchaseDate,
      order: 0,
      icon: ShoppingBag,
      title: 'Purchased',
      aside: a.purchasePrice != null ? <span className="font-mono text-sm">{formatMoney(a.purchasePrice)}</span> : undefined,
    });
  }

  for (const w of a.warranties) {
    entries.push({ key: `ws-${w.id}`, date: w.startDate, order: 1, icon: ShieldCheck, title: 'Warranty started', body: w.details });
    entries.push({
      key: `we-${w.id}`,
      date: w.endDate,
      order: 9,
      icon: ShieldCheck,
      title: w.endDate >= today ? 'Warranty ends' : 'Warranty ended',
      body: w.details,
    });
  }

  for (const r of a.serviceRequests) {
    const closed = r.status === 'cancelled' || r.status === 'rejected';
    entries.push({
      key: `rq-${r.id}`,
      date: day(r.createdAt),
      order: 2,
      icon: ClipboardList,
      title: (
        <>
          {r.type === 'repair' ? 'Problem reported' : 'Maintenance requested'}
          {r.status !== 'completed' && (
            <span className="ml-2 align-middle">
              <Badge tone={closed ? 'neutral' : 'accent'}>{REQUEST_STATUS_LABELS[r.status]}</Badge>
            </span>
          )}
        </>
      ),
      body: (
        <>
          {r.description}{' '}
          <Link to={`/app/requests/${r.id}`} className="text-xs text-muted underline underline-offset-2">
            View request
          </Link>
        </>
      ),
    });
  }

  for (const s of a.serviceRecords) {
    entries.push({
      key: `sr-${s.id}`,
      date: s.serviceDate,
      order: 3,
      icon: Wrench,
      title: (
        <>
          {s.type === 'repair' ? 'Repaired' : 'Serviced'}
          <span className="ml-2 align-middle">
            <Badge tone={s.type === 'repair' ? 'blush' : 'accent'}>{SERVICE_TYPE_LABELS[s.type]}</Badge>
          </span>
        </>
      ),
      body: (
        <>
          {s.source === 'manual' && s.problem && <span className="block text-muted">{s.problem}</span>}
          {s.workDone && <span className="block whitespace-pre-line">{s.workDone}</span>}
          {s.partsReplaced && <span className="block">Parts replaced: {s.partsReplaced}</span>}
          <span className="block text-xs text-muted">
            {[s.performedBy, s.schedule?.title, s.source === 'manual' ? 'Added by you' : null].filter(Boolean).join(' · ')}
          </span>
        </>
      ),
      aside: s.cost != null ? <span className="font-mono text-sm">{formatMoney(s.cost)}</span> : undefined,
    });
  }

  for (const [i, c] of a.statusChanges.entries()) {
    entries.push({
      key: `st-${i}`,
      date: day(c.createdAt),
      order: 5,
      icon: Archive,
      title: c.toStatus === 'active' ? 'Back in use' : `Marked as ${ASSET_STATUS_LABELS[c.toStatus].toLowerCase()}`,
    });
  }

  // Coming up: only for assets still in use.
  if (a.status === 'active') {
    for (const m of a.maintenanceSchedules) {
      entries.push({
        key: `md-${m.id}`,
        date: m.nextDueDate,
        order: 8,
        icon: CalendarClock,
        title: m.nextDueDate < today ? `${m.title} overdue` : `${m.title} due`,
      });
    }
  }

  const upcoming = entries
    .filter((e) => e.date > today || e.key.startsWith('md-'))
    .sort((x, y) => x.date.localeCompare(y.date) || x.order - y.order);
  const past = entries
    .filter((e) => !upcoming.includes(e))
    .sort((x, y) => y.date.localeCompare(x.date) || y.order - x.order);
  return { upcoming, past };
}

function EntryList({ entries }: { entries: Entry[] }) {
  return (
    <ol className="relative space-y-5 border-l-2 border-line pl-6">
      {entries.map((e) => {
        const Icon = e.icon;
        return (
          <li key={e.key} className="relative">
            <span className="absolute -left-[37px] grid size-6 place-items-center rounded-full bg-surface shadow-neu-sm">
              <Icon className="size-3.5" aria-hidden />
            </span>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-sm text-muted">{formatDate(e.date)}</span>
              <span className="font-medium">{e.title}</span>
              {e.aside && <span className="ml-auto">{e.aside}</span>}
            </div>
            {e.body && <div className="mt-1 text-sm">{e.body}</div>}
          </li>
        );
      })}
    </ol>
  );
}

export function AssetTimeline({ asset }: { asset: AssetDetail }) {
  const [adding, setAdding] = useState(false);
  const { upcoming, past } = buildEntries(asset);

  return (
    <Card className="animate-fade-up">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[1.5rem] font-bold">Timeline</h2>
          <p className="mt-1 text-sm text-muted">
            {asset.serviceRecords.length} {asset.serviceRecords.length === 1 ? 'service' : 'services'} · Total spent on service{' '}
            <span className="font-mono font-medium text-ink">{formatMoney(asset.totalServiceCost)}</span>
          </p>
        </div>
        <Button variant="ghost" className="px-3 py-2" onClick={() => setAdding(true)}>
          <Plus className="size-4" aria-hidden />
          Add past service
        </Button>
      </div>

      {upcoming.length > 0 && (
        <section className="mt-6">
          <h3 className="mb-4 text-xs font-medium tracking-[0.12em] text-muted uppercase">Coming up</h3>
          <EntryList entries={upcoming} />
        </section>
      )}
      <section className="mt-6">
        {upcoming.length > 0 && <h3 className="mb-4 text-xs font-medium tracking-[0.12em] text-muted uppercase">History</h3>}
        {past.length ? (
          <EntryList entries={past} />
        ) : (
          <p className="text-sm text-muted">
            Nothing recorded yet. Add the purchase date, warranties and past services, and service requests will appear here as they happen.
          </p>
        )}
      </section>

      <ManualServiceModal open={adding} onClose={() => setAdding(false)} assetId={asset.id} schedules={asset.maintenanceSchedules} />
    </Card>
  );
}
