import { daysBetween, SERVICE_TYPE_LABELS, todayIso, type RequestStatus, type ServiceRequestDetail, assetLabel } from '@ham/shared';
import { Mail, MapPin, Phone } from 'lucide-react';
import type { ReactNode } from 'react';
import { formatDate, formatMoney } from '../lib/format';
import { Card } from '../ui/Card';
import { categoryIcon } from '../ui/categoryIcon';
import { PageHeader } from '../ui/PageHeader';
import { formatWhen } from './format';
import { RequestStatusBadge } from './RequestStatusBadge';
import { buildTimeline } from './timeline';

const STEPS: { status: RequestStatus; label: string }[] = [
  { status: 'new', label: 'Requested' },
  { status: 'accepted', label: 'Accepted' },
  { status: 'assigned', label: 'Technician assigned' },
  { status: 'in_progress', label: 'In progress' },
  { status: 'completed', label: 'Completed' },
];

function Progress({ status }: { status: RequestStatus }) {
  const current = STEPS.findIndex((s) => s.status === status);
  if (current < 0) return null; // rejected / cancelled
  return (
    <ol className="mb-8 grid animate-fade-up grid-cols-5 gap-2" aria-label="Progress">
      {STEPS.map((s, i) => {
        const done = i <= current;
        return (
          <li key={s.status} className="min-w-0">
            <div className={`h-1.5 rounded-full ${done ? 'bg-accent-strong' : 'bg-line'}`} />
            <div className={`mt-2 truncate text-xs ${i === current ? 'font-medium' : 'text-muted'}`} aria-current={i === current ? 'step' : undefined}>
              {s.label}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-4 text-lg font-bold">{children}</h2>;
}

function Contact({ name, phone, email, address, sub }: { name: string; phone?: string | null; email?: string; address?: string; sub?: string }) {
  return (
    <div className="space-y-1.5 text-sm">
      <div className="text-base font-medium">{name}</div>
      {sub && <div className="text-muted">{sub}</div>}
      {phone && (
        <a href={`tel:${phone}`} className="flex items-center gap-2 font-mono text-xs hover:underline">
          <Phone className="size-3.5" aria-hidden /> {phone}
        </a>
      )}
      {email && (
        <a href={`mailto:${email}`} className="flex items-center gap-2 font-mono text-xs hover:underline">
          <Mail className="size-3.5" aria-hidden /> {email}
        </a>
      )}
      {address && (
        <div className="flex items-start gap-2 text-muted">
          <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {address}
        </div>
      )}
    </div>
  );
}

function WarrantyStatus({ warranties }: { warranties: ServiceRequestDetail['asset']['warranties'] }) {
  const today = todayIso();
  const valid = warranties.filter((w) => w.startDate <= today && w.endDate >= today);
  if (!warranties.length) return <p className="text-sm text-muted">No warranty recorded.</p>;
  if (!valid.length) {
    const last = warranties[warranties.length - 1]!;
    return <p className="text-sm text-muted">Warranty ended {formatDate(last.endDate)}.</p>;
  }
  return (
    <ul className="space-y-1.5">
      {valid.map((w, i) => (
        <li key={i} className="rounded-sm bg-accent px-3 py-2 text-sm">
          <span className="font-medium">Under warranty</span> until {formatDate(w.endDate)}
          {w.details && <span className="block text-xs text-muted">{w.details}</span>}
        </li>
      ))}
    </ul>
  );
}

/**
 * Shared request page. `perspective` decides whose contact details are shown;
 * `actions` and `visitSection` carry the role-specific controls.
 */
export function RequestDetailView({
  detail: d,
  perspective,
  back,
  actions,
  visitSection,
}: {
  detail: ServiceRequestDetail;
  perspective: 'customer' | 'center' | 'technician';
  back: { to: string; label: string };
  actions?: ReactNode;
  visitSection?: ReactNode;
}) {
  const Icon = categoryIcon(d.asset.category);
  const timeline = buildTimeline(d);
  const today = todayIso();

  return (
    <>
      <PageHeader
        back={back}
        leading={
          <div className="grid size-16 shrink-0 place-items-center rounded-md bg-surface shadow-neu">
            <Icon className="size-7" aria-hidden />
          </div>
        }
        title={assetLabel(d.asset)}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            {d.asset.name && (
              <span>
                {d.asset.brand} {d.asset.category} ·
              </span>
            )}
            <span>{SERVICE_TYPE_LABELS[d.type]}</span>
            <RequestStatusBadge status={d.status} />
            <span className="text-sm">Raised {formatDate(d.createdAt)}</span>
          </span>
        }
      />

      <Progress status={d.status} />

      <div className="grid items-start gap-6 md:grid-cols-[7fr_5fr]">
        <div className="space-y-6">
          {actions && <div className="md:hidden">{actions}</div>}

          <Card className="animate-fade-up">
            <SectionTitle>Problem described</SectionTitle>
            <p className="whitespace-pre-line">{d.description}</p>
            {d.schedule && <p className="mt-3 text-sm text-muted">For maintenance schedule: {d.schedule.title}</p>}
          </Card>

          {d.record && (
            <Card className="animate-fade-up">
              <SectionTitle>Work done</SectionTitle>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-xs tracking-[0.08em] text-muted uppercase">What was done</dt>
                  <dd className="mt-1 whitespace-pre-line">{d.record.workDone}</dd>
                </div>
                <div>
                  <dt className="text-xs tracking-[0.08em] text-muted uppercase">Parts replaced</dt>
                  <dd className="mt-1 whitespace-pre-line">{d.record.partsReplaced || 'None'}</dd>
                </div>
                <div>
                  <dt className="text-xs tracking-[0.08em] text-muted uppercase">Cost</dt>
                  <dd className="mt-1 font-mono text-sm">{d.record.cost != null ? formatMoney(d.record.cost) : 'Not recorded'}</dd>
                </div>
                <div>
                  <dt className="text-xs tracking-[0.08em] text-muted uppercase">Completed on</dt>
                  <dd className="mt-1">{formatDate(d.record.serviceDate)}</dd>
                </div>
                <div>
                  <dt className="text-xs tracking-[0.08em] text-muted uppercase">By</dt>
                  <dd className="mt-1">{d.record.performedBy}</dd>
                </div>
              </dl>
            </Card>
          )}

          {visitSection}

          <Card className="animate-fade-up">
            <SectionTitle>Activity</SectionTitle>
            <ol className="relative space-y-5 border-l-2 border-line pl-6">
              {timeline.map((e) => (
                <li key={e.id} className="relative">
                  <span className="absolute top-1.5 -left-[31px] grid size-3 place-items-center rounded-full bg-accent-strong ring-4 ring-surface" />
                  <div className="text-sm font-medium">{e.title}</div>
                  {e.detail && <p className="mt-1 text-sm whitespace-pre-line">{e.detail}</p>}
                  <div className="mt-0.5 text-xs text-muted">
                    {formatWhen(e.at)}
                    {e.by && ` · ${e.by}`}
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-6">
          {actions && <div className="hidden md:block">{actions}</div>}

          <Card className="animate-fade-up [animation-delay:80ms]">
            {perspective === 'customer' ? (
              <>
                <SectionTitle>Service center</SectionTitle>
                <Contact name={d.center.name} phone={d.center.phone} email={d.center.email} address={d.center.address} />
                {d.technician && (
                  <div className="mt-5 border-t border-line/70 pt-5">
                    <div className="mb-1.5 text-xs tracking-[0.08em] text-muted uppercase">Technician</div>
                    <Contact name={d.technician.name} phone={d.technician.phone} />
                  </div>
                )}
              </>
            ) : (
              <>
                <SectionTitle>Customer</SectionTitle>
                <Contact name={d.customer.name} phone={d.customer.phone} email={d.customer.email} address={d.home.address} sub={d.home.name} />
                {perspective === 'center' && d.technician && (
                  <div className="mt-5 border-t border-line/70 pt-5">
                    <div className="mb-1.5 text-xs tracking-[0.08em] text-muted uppercase">Technician</div>
                    <Contact name={d.technician.name} phone={d.technician.phone} />
                  </div>
                )}
              </>
            )}
          </Card>

          <Card className="animate-fade-up [animation-delay:160ms]">
            <SectionTitle>Asset</SectionTitle>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs tracking-[0.08em] text-muted uppercase">Model</dt>
                <dd className="mt-1 font-mono text-xs">{d.asset.model ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs tracking-[0.08em] text-muted uppercase">Serial no.</dt>
                <dd className="mt-1 font-mono text-xs break-all">{d.asset.serialNumber ?? '—'}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs tracking-[0.08em] text-muted uppercase">Purchased</dt>
                <dd className="mt-1">
                  {d.asset.purchaseDate ? (
                    <>
                      {formatDate(d.asset.purchaseDate)}{' '}
                      <span className="text-muted">({Math.floor(daysBetween(d.asset.purchaseDate, today) / 365.25 * 10) / 10} years ago)</span>
                    </>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
            </dl>
            <div className="mt-4">
              <WarrantyStatus warranties={d.asset.warranties} />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

export function VisitHistory({ visits }: { visits: ServiceRequestDetail['visits'] }) {
  const past = visits.filter((v) => v.status === 'declined' || v.status === 'withdrawn');
  if (!past.length) return null;
  return (
    <details className="mt-4 text-sm">
      <summary className="cursor-pointer text-muted">Earlier proposals ({past.length})</summary>
      <ul className="mt-2 space-y-1 text-muted">
        {past.map((v) => (
          <li key={v.id} className="flex items-center gap-2">
            <span className="line-through">{formatWhen(v.proposedAt)}</span>
            <span>· {v.status === 'declined' ? 'declined by customer' : 'withdrawn'}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
