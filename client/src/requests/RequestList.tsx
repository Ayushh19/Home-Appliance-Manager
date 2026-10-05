import { SERVICE_TYPE_LABELS, type ServiceRequestSummary, assetLabel } from '@ham/shared';
import { CalendarCheck, CalendarClock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { formatDate } from '../lib/format';
import { categoryIcon } from '../ui/categoryIcon';
import { formatVisit } from './format';
import { RequestStatusBadge } from './RequestStatusBadge';

/** Who the row should name besides the asset. */
export type ListPerspective = 'customer' | 'center' | 'technician';

export function RequestList({
  requests,
  linkTo,
  perspective,
}: {
  requests: ServiceRequestSummary[];
  linkTo: (id: string) => string;
  perspective: ListPerspective;
}) {
  return (
    <ul className="divide-y divide-line/70">
      {requests.map((r, i) => {
        const Icon = categoryIcon(r.asset.category);
        const counterpart =
          perspective === 'customer'
            ? r.centerName + (r.technicianName ? ` · ${r.technicianName}` : '')
            : perspective === 'center'
              ? `${r.customerName}${r.technicianName ? ` · ${r.technicianName}` : ''}`
              : `${r.customerName} · ${r.homeName}`;
        return (
          <li key={r.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 8) * 80}ms` }}>
            <Link to={linkTo(r.id)} className="flex items-start gap-4 px-6 py-4 transition-colors duration-200 hover:bg-surface-raised">
              <div className="grid size-11 shrink-0 place-items-center rounded-sm bg-surface shadow-neu-sm">
                <Icon className="size-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-medium">{assetLabel(r.asset)}</span>
                  {r.asset.name && (
                    <span className="text-xs text-muted">
                      {r.asset.brand} {r.asset.category}
                    </span>
                  )}
                  <RequestStatusBadge status={r.status} />
                </div>
                <p className="mt-0.5 truncate text-sm">
                  <span className="text-muted">{SERVICE_TYPE_LABELS[r.type]}:</span> {r.description}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted">
                  {counterpart} · Raised {formatDate(r.createdAt)}
                </p>
                {r.visit && (
                  <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs">
                    {r.visit.status === 'confirmed' ? (
                      <CalendarCheck className="size-3.5" aria-hidden />
                    ) : (
                      <CalendarClock className="size-3.5" aria-hidden />
                    )}
                    {r.visit.status === 'confirmed' ? 'Visit' : 'Proposed visit'}: {formatVisit(r.visit.proposedAt)}
                  </p>
                )}
              </div>
              <ChevronRight className="mt-3 size-5 shrink-0 text-muted" aria-hidden />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
