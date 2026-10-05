import { OPEN_REQUEST_STATUSES, type AssetDetail } from '@ham/shared';
import { Wrench } from 'lucide-react';
import { Link } from 'react-router';
import { RequestList } from '../../requests/RequestList';
import { buttonClass } from '../../ui/Button';
import { Card } from '../../ui/Card';

/** Open requests for this asset, plus the Request service button. */
export function ServiceRequestsSection({ asset }: { asset: AssetDetail }) {
  const open = asset.serviceRequests.filter((r) => OPEN_REQUEST_STATUSES.includes(r.status) || r.status === 'rejected');
  return (
    <Card padded={false} className="animate-fade-up overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 pb-4 sm:px-8 sm:pt-8">
        <div>
          <h2 className="text-[1.5rem] font-bold">Service requests</h2>
          {asset.status !== 'active' && <p className="text-sm text-muted">Service can't be requested for retired or replaced assets.</p>}
        </div>
        {asset.status === 'active' && (
          <Link to={`/app/assets/${asset.id}/request`} className={buttonClass()}>
            <Wrench className="size-4" aria-hidden />
            Request service
          </Link>
        )}
      </div>
      {open.length ? (
        <div className="border-t border-line/70">
          <RequestList requests={open} perspective="customer" linkTo={(id) => `/app/requests/${id}`} />
        </div>
      ) : (
        <p className="px-6 pb-6 text-sm text-muted sm:px-8 sm:pb-8">No open requests.</p>
      )}
    </Card>
  );
}
