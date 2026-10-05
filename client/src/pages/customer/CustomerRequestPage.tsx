import { CANCELLABLE_STATUSES, type ServiceRequestDetail } from '@ham/shared';
import { CalendarCheck, CalendarClock, Clock } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router';
import { useServiceCenters, useServiceRequest } from '../../lib/queries';
import { CenterPicker } from '../../requests/CenterPicker';
import { formatVisit } from '../../requests/format';
import { RequestDetailView, SectionTitle, VisitHistory } from '../../requests/RequestDetailView';
import { useRequestAction } from '../../requests/useRequestAction';
import { FormError } from '../../ui/Alert';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { ConfirmModal } from '../../ui/ConfirmModal';
import { Skeleton } from '../../ui/Skeleton';

function VisitSection({ d }: { d: ServiceRequestDetail }) {
  const pending = d.visits.find((v) => v.status === 'pending');
  const confirmed = d.visits.find((v) => v.status === 'confirmed');
  const respond = useRequestAction<{ response: 'confirm' | 'decline' }>(d.id, `visits/${pending?.id}/respond`);
  if (!['assigned', 'in_progress', 'completed'].includes(d.status) && !d.visits.length) return null;

  return (
    <Card className="animate-fade-up">
      <SectionTitle>Visit</SectionTitle>
      <FormError message={respond.error?.message} />
      {confirmed ? (
        <div className="flex items-center gap-3">
          <CalendarCheck className="size-5 shrink-0" aria-hidden />
          <div>
            <div className="font-medium">{formatVisit(confirmed.proposedAt)}</div>
            <div className="text-sm text-muted">Confirmed</div>
          </div>
        </div>
      ) : pending ? (
        <div>
          <div className="flex items-center gap-3">
            <CalendarClock className="size-5 shrink-0" aria-hidden />
            <div>
              <div className="font-medium">{formatVisit(pending.proposedAt)}</div>
              <div className="text-sm text-muted">Proposed by {d.technician?.name}. Can you be available?</div>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => respond.mutate({ response: 'confirm' })} loading={respond.isPending && respond.variables?.response === 'confirm'}>
              Confirm this time
            </Button>
            <Button variant="ghost" onClick={() => respond.mutate({ response: 'decline' })} loading={respond.isPending && respond.variables?.response === 'decline'}>
              Not available
            </Button>
          </div>
        </div>
      ) : d.status === 'assigned' ? (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Clock className="size-4" aria-hidden /> Waiting for {d.technician?.name ?? 'the technician'} to propose a visit time.
        </p>
      ) : (
        <p className="text-sm text-muted">No visit scheduled.</p>
      )}
      <VisitHistory visits={d.visits} />
    </Card>
  );
}

function RejectedPanel({ d }: { d: ServiceRequestDetail }) {
  const centers = useServiceCenters(d.asset.id, d.id);
  const [centerId, setCenterId] = useState('');
  const [error, setError] = useState<string>();
  const resend = useRequestAction<{ serviceCenterId: string }>(d.id, 'resend');

  return (
    <Card className="animate-fade-up">
      <SectionTitle>Rejected by {d.center.name}</SectionTitle>
      {d.rejectionReason && <p className="mb-4 rounded-sm bg-blush px-4 py-3 text-sm">“{d.rejectionReason}”</p>}
      {centers.isPending ? (
        <Skeleton className="h-24" />
      ) : centers.data?.length ? (
        <>
          <p className="mb-4 text-sm text-muted">Send this request to another service center.</p>
          <FormError message={resend.error?.message} />
          <CenterPicker centers={centers.data} value={centerId} onChange={setCenterId} error={error} />
          <Button
            className="mt-4 w-full"
            loading={resend.isPending}
            onClick={() => (centerId ? resend.mutate({ serviceCenterId: centerId }) : setError('Choose a service center'))}
          >
            Send to this center
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted">No other service center supports this asset right now.</p>
      )}
    </Card>
  );
}

export function CustomerRequestPage() {
  const { requestId = '' } = useParams();
  const request = useServiceRequest(requestId);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const cancel = useRequestAction(requestId, 'cancel', () => setConfirmCancel(false));

  if (request.isPending) return <Skeleton className="h-96" />;
  if (request.isError) return <FormError message={request.error.message} />;
  const d = request.data;

  const actions =
    d.status === 'rejected' ? (
      <RejectedPanel d={d} />
    ) : CANCELLABLE_STATUSES.includes(d.status) ? (
      <Card className="animate-fade-up">
        <p className="text-sm text-muted">You can cancel this request until the technician starts work.</p>
        <FormError message={cancel.error?.message} />
        <Button variant="ghost" className="mt-4 w-full" onClick={() => setConfirmCancel(true)}>
          Cancel request
        </Button>
      </Card>
    ) : undefined;

  return (
    <>
      <RequestDetailView
        detail={d}
        perspective="customer"
        back={{ to: '/app/requests', label: 'Service requests' }}
        actions={actions}
        visitSection={<VisitSection d={d} />}
      />
      <ConfirmModal
        open={confirmCancel}
        title="Cancel this request?"
        message={`The request will be withdrawn from ${d.center.name}. This can't be undone.`}
        confirmLabel="Cancel request"
        loading={cancel.isPending}
        onConfirm={() => cancel.mutate(undefined)}
        onClose={() => setConfirmCancel(false)}
      />
    </>
  );
}
