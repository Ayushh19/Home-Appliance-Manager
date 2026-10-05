import {
  ASSET_STATUS_LABELS,
  assetLabel,
  daysBetween,
  DASHBOARD_WINDOW_DAYS,
  SERVICE_TYPE_LABELS,
  todayIso,
  type Dashboard,
  type DashboardAsset,
} from '@ham/shared';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock, ChevronRight, ClipboardList, History, House, ShieldAlert, Wrench } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useMe } from '../../auth/useAuth';
import { api } from '../../lib/api';
import { formatDate, formatMoney } from '../../lib/format';
import { keys, useHomes } from '../../lib/queries';
import { RequestList } from '../../requests/RequestList';
import { FormError } from '../../ui/Alert';
import { Badge } from '../../ui/Badge';
import { buttonClass } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { categoryIcon } from '../../ui/categoryIcon';
import { EmptyState } from '../../ui/EmptyState';
import { PageHeader } from '../../ui/PageHeader';
import { SelectField } from '../../ui/SelectField';
import { Skeleton } from '../../ui/Skeleton';
import { Toggle } from '../../ui/Toggle';

const useDashboard = (homeId: string | undefined, includeRetired: boolean) =>
  useQuery({
    queryKey: [...keys.dashboard, homeId, includeRetired],
    queryFn: () => api<Dashboard>(`/dashboard?homeId=${homeId}${includeRetired ? '&includeRetired=1' : ''}`),
    enabled: Boolean(homeId),
    refetchInterval: 60_000,
    placeholderData: (previous) => (previous?.home.id === homeId ? previous : undefined),
  });

// Per-browser conveniences; the page works the same without storage.
const LAST_HOME_KEY = 'overview.homeId';
const INCLUDE_RETIRED_KEY = 'overview.includeRetired';
function remember(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable: just don't remember */
  }
}
function recall(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function relativeDays(iso: string) {
  const days = daysBetween(todayIso(), iso);
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
}

const statClass = 'block rounded-sm bg-surface px-5 py-4 shadow-neu-sm';
const statLinkClass =
  statClass +
  ' transition-[box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-neu active:translate-y-px active:duration-150';

/** A figure; links to where its items are (another page, or "#id" on this one) when `to` is given. */
function Stat({ label, value, sub, to }: { label: string; value: ReactNode; sub?: ReactNode; to?: string }) {
  const content = (
    <>
      <div className="truncate font-mono text-2xl font-medium">{value}</div>
      <div className="text-sm text-muted">{label}</div>
      {sub && <div className="mt-1 truncate text-xs text-muted">{sub}</div>}
    </>
  );
  if (!to) return <div className={statClass}>{content}</div>;
  return to.startsWith('#') ? (
    <a href={to} className={statLinkClass}>
      {content}
    </a>
  ) : (
    <Link to={to} className={statLinkClass}>
      {content}
    </Link>
  );
}

function Section({
  id,
  title,
  icon: Icon,
  count,
  children,
  delay = 0,
}: {
  id?: string;
  title: string;
  icon: typeof House;
  count: number;
  children: ReactNode;
  delay?: number;
}) {
  return (
    <Card id={id} padded={false} className="animate-fade-up scroll-mt-24 overflow-hidden" style={{ animationDelay: `${delay}ms` }}>
      <h2 className="flex items-center gap-2 px-6 pt-6 pb-3 text-lg font-bold">
        <Icon className="size-5" aria-hidden />
        {title}
        <span className="font-mono text-sm font-normal text-muted">{count}</span>
      </h2>
      {children}
    </Card>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="px-6 pb-6 text-sm text-muted">{children}</p>;
}

/** One row linking to an asset: icon, asset name, a line of detail and something on the right. */
function AssetRow({ asset, children, aside }: { asset: DashboardAsset; children: ReactNode; aside?: ReactNode }) {
  const Icon = categoryIcon(asset.category);
  return (
    <li>
      <Link to={`/app/assets/${asset.id}`} className="flex items-center gap-4 px-6 py-3.5 transition-colors duration-200 hover:bg-surface-raised">
        <div className="grid size-10 shrink-0 place-items-center rounded-sm bg-surface shadow-neu-sm">
          <Icon className="size-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{children}</div>
          <div className="truncate text-xs text-muted">
            {asset.name ? `${asset.name} · ` : ''}
            {asset.brand} {asset.category}
            {asset.model && <span className="font-mono"> · {asset.model}</span>}
          </div>
        </div>
        {aside}
        <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
      </Link>
    </li>
  );
}

export function DashboardPage() {
  const { data: user } = useMe();
  const homes = useHomes();
  const [params, setParams] = useSearchParams();
  const firstName = user?.name.split(' ')[0] ?? '';

  // Selected home: ?home=, else the last one viewed, else the first.
  const list = homes.data ?? [];
  const wanted = params.get('home') ?? recall(LAST_HOME_KEY);
  const homeId = (list.find((h) => h.id === wanted) ?? list[0])?.id;
  // Costs of retired/replaced assets are left out unless switched on (docs/DECISIONS.md #33).
  const [includeRetired, setIncludeRetired] = useState(() => recall(INCLUDE_RETIRED_KEY) === '1');
  const dashboard = useDashboard(homeId, includeRetired);
  const selectHome = (id: string) => {
    remember(LAST_HOME_KEY, id);
    setParams({ home: id }, { replace: true });
  };
  const toggleRetired = (on: boolean) => {
    remember(INCLUDE_RETIRED_KEY, on ? '1' : '0');
    setIncludeRetired(on);
  };

  if (homes.isPending || (homeId && dashboard.isPending)) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-24" />
        <div className="grid gap-6 md:grid-cols-[7fr_5fr]">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }
  if (homes.isError || dashboard.isError) return <FormError message="Could not load your overview." />;

  if (!homeId) {
    return (
      <>
        <PageHeader title={`Hello, ${firstName}`} />
        <Card className="animate-fade-up">
          <EmptyState
            icon={House}
            title="Start by adding your home"
            description="Add your home, then the appliances in it. This page will then show what you've spent, what's due for service, warranties ending soon and your service requests."
            action={
              <Link to="/app/homes" className={buttonClass()}>
                Go to homes
              </Link>
            }
          />
        </Card>
      </>
    );
  }
  const d = dashboard.data!;
  const overdue = d.maintenanceDue.filter((m) => m.nextDueDate < todayIso()).length;
  const needsAction = d.activeRequests.filter(
    (r) => r.status === 'rejected' || (r.status === 'assigned' && r.visit?.status === 'pending'),
  ).length;

  return (
    <>
      <PageHeader
        title={d.home.name}
        subtitle={`Hello, ${firstName}. Here's how things stand at this home.`}
        actions={
          list.length > 1 ? (
            <SelectField
              label="Home"
              className="min-w-56 [&_label]:sr-only"
              options={list.map((h) => ({ value: h.id, label: h.name }))}
              value={homeId}
              onChange={(e) => selectHome(e.target.value)}
            />
          ) : undefined
        }
      />

      <div className="mb-3 flex animate-fade-up justify-end">
        <Toggle label="Include retired and replaced items in costs" checked={includeRetired} onChange={toggleRetired} />
      </div>
      <div className="mb-8 grid animate-fade-up grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Spent on service" value={formatMoney(d.totalSpent)} sub={`${formatMoney(d.spentThisYear)} this year`} />
        <Stat label={d.activeAssetCount === 1 ? 'Asset in use' : 'Assets in use'} value={d.activeAssetCount} to={`/app/homes/${d.home.id}`} />
        <Stat label="Open service requests" value={d.activeRequests.length} to="#requests" />
        <Stat
          label="Next service"
          value={d.nextService ? relativeDays(d.nextService.nextDueDate) : '—'}
          sub={d.nextService ? `${assetLabel(d.nextService.asset)} · ${d.nextService.title}` : 'No maintenance scheduled'}
          to={d.nextService ? `/app/assets/${d.nextService.asset.id}` : undefined}
        />
      </div>

      {(overdue > 0 || needsAction > 0) && (
        <div role="status" className="mb-8 flex animate-fade-up flex-wrap gap-x-6 gap-y-2 rounded-sm bg-blush px-5 py-3 text-sm">
          {overdue > 0 && (
            <span>
              <span className="font-mono font-medium">{overdue}</span> maintenance {overdue === 1 ? 'task is' : 'tasks are'} overdue
            </span>
          )}
          {needsAction > 0 && (
            <span>
              <span className="font-mono font-medium">{needsAction}</span> service {needsAction === 1 ? 'request needs' : 'requests need'} your
              response
            </span>
          )}
        </div>
      )}

      <div className="grid items-start gap-6 md:grid-cols-[7fr_5fr]">
        <div className="space-y-6">
          <Section id="requests" title="Active service requests" icon={ClipboardList} count={d.activeRequests.length}>
            {d.activeRequests.length ? (
              <div className="border-t border-line/70">
                <RequestList requests={d.activeRequests} perspective="customer" linkTo={(id) => `/app/requests/${id}`} />
              </div>
            ) : (
              <Empty>No open service requests. To request service, open an asset and choose Request service.</Empty>
            )}
          </Section>

          <Section title="Recently serviced" icon={History} count={d.recentlyServiced.length} delay={80}>
            {d.recentlyServiced.length ? (
              <ul className="divide-y divide-line/70 border-t border-line/70">
                {d.recentlyServiced.map((s) => (
                  <AssetRow
                    key={s.recordId}
                    asset={s.asset}
                    aside={s.cost != null ? <span className="font-mono text-sm">{formatMoney(s.cost)}</span> : undefined}
                  >
                    {formatDate(s.serviceDate)} · {SERVICE_TYPE_LABELS[s.type]}
                    {s.workDone && <span className="font-normal text-muted"> · {s.workDone}</span>}
                  </AssetRow>
                ))}
              </ul>
            ) : (
              <Empty>Nothing serviced in the last {DASHBOARD_WINDOW_DAYS.recentService} days.</Empty>
            )}
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Most serviced" icon={Wrench} count={d.mostServiced.length} delay={40}>
            {d.mostServiced.length ? (
              <ul className="divide-y divide-line/70 border-t border-line/70">
                {d.mostServiced.map((m) => (
                  <AssetRow key={m.asset.id} asset={m.asset} aside={<span className="font-mono text-sm">{formatMoney(m.spent)}</span>}>
                    {m.serviceCount} {m.serviceCount === 1 ? 'service' : 'services'}
                    {m.asset.status !== 'active' && <span className="font-normal text-muted"> · {ASSET_STATUS_LABELS[m.asset.status]}</span>}
                  </AssetRow>
                ))}
              </ul>
            ) : (
              <Empty>No services recorded for this home yet.</Empty>
            )}
          </Section>

          <Section id="maintenance" title="Maintenance coming up" icon={CalendarClock} count={d.maintenanceDue.length} delay={80}>
            {d.maintenanceDue.length ? (
              <ul className="divide-y divide-line/70 border-t border-line/70">
                {d.maintenanceDue.map((m) => {
                  const late = m.nextDueDate < todayIso();
                  return (
                    <AssetRow
                      key={m.scheduleId}
                      asset={m.asset}
                      aside={<Badge tone={late ? 'blush' : 'accent'}>{late ? 'Overdue' : relativeDays(m.nextDueDate)}</Badge>}
                    >
                      {m.title}
                      <span className="font-normal text-muted">
                        {' '}
                        · {late ? 'was due' : 'due'} {formatDate(m.nextDueDate)}
                      </span>
                    </AssetRow>
                  );
                })}
              </ul>
            ) : (
              <Empty>No maintenance due in the next {DASHBOARD_WINDOW_DAYS.maintenance} days.</Empty>
            )}
          </Section>

          <Section id="warranties" title="Warranties ending soon" icon={ShieldAlert} count={d.warrantiesEnding.length} delay={160}>
            {d.warrantiesEnding.length ? (
              <>
                <ul className="divide-y divide-line/70 border-t border-line/70">
                  {d.warrantiesEnding.map((w) => (
                    <AssetRow key={w.warrantyId} asset={w.asset} aside={<Badge tone="blush">{relativeDays(w.endDate)}</Badge>}>
                      Ends {formatDate(w.endDate)}
                      {w.details && <span className="font-normal text-muted"> · {w.details}</span>}
                    </AssetRow>
                  ))}
                </ul>
                <p className="border-t border-line/70 px-6 py-3 text-xs text-muted">
                  If something isn't working right, you may be able to get it repaired under warranty before it ends.
                </p>
              </>
            ) : (
              <Empty>No warranties ending in the next {DASHBOARD_WINDOW_DAYS.warranty} days.</Empty>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}
