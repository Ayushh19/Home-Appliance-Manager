import { rejectServiceRequestSchema, type ServiceRequestDetail } from '@ham/shared';
import { CalendarCheck, CalendarClock, UserCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { fieldErrorsOf } from '../../lib/api';
import { validate } from '../../lib/form';
import { useServiceRequest, useTechnicians } from '../../lib/queries';
import { formatVisit } from '../../requests/format';
import { RequestDetailView, SectionTitle, VisitHistory } from '../../requests/RequestDetailView';
import { useRequestAction } from '../../requests/useRequestAction';
import { FormError } from '../../ui/Alert';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Modal } from '../../ui/Modal';
import { SelectField } from '../../ui/SelectField';
import { Skeleton } from '../../ui/Skeleton';
import { TextAreaField } from '../../ui/TextAreaField';

function RejectModal({ open, onClose, requestId }: { open: boolean; onClose: () => void; requestId: string }) {
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const reject = useRequestAction<{ reason: string }>(requestId, 'reject', onClose);
  useEffect(() => {
    if (open) {
      setReason('');
      setErrors({});
    }
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Reject request">
      <form
        noValidate
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          const result = validate(rejectServiceRequestSchema, { reason });
          setErrors(result.errors ?? {});
          if (result.data) reject.mutate(result.data, { onError: (err) => setErrors(fieldErrorsOf(err)) });
        }}
      >
        <p className="text-sm text-muted">The customer sees this reason and can send the request to another center.</p>
        <FormError message={reject.error?.message} />
        <TextAreaField
          label="Reason"
          placeholder="e.g. We don't service this area, no slots this week"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          error={errors.reason}
          autoFocus
        />
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={reject.isPending}>
            Reject request
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function AssignPanel({ d }: { d: ServiceRequestDetail }) {
  const technicians = useTechnicians();
  const [technicianId, setTechnicianId] = useState('');
  const [error, setError] = useState<string>();
  const assign = useRequestAction<{ technicianId: string }>(d.id, 'assign', () => setTechnicianId(''));
  const reassign = d.status === 'assigned';
  const options = (technicians.data ?? []).filter((t) => t.id !== d.technician?.id);

  return (
    <Card className="animate-fade-up">
      <SectionTitle>{reassign ? 'Reassign technician' : 'Assign a technician'}</SectionTitle>
      {reassign && (
        <p className="mb-4 text-sm text-muted">
          Currently assigned to <span className="font-medium text-ink">{d.technician?.name}</span>. Reassigning withdraws any visit time they
          proposed; the new technician proposes a fresh one.
        </p>
      )}
      {technicians.isPending ? (
        <Skeleton className="h-12" />
      ) : options.length === 0 ? (
        <p className="text-sm text-muted">
          {reassign ? 'You have no other technicians.' : 'You have no technicians yet.'}{' '}
          <Link to="/center/team" className="underline underline-offset-4">
            Add a technician
          </Link>
        </p>
      ) : (
        <>
          <FormError message={assign.error?.message} />
          <SelectField
            label="Technician"
            placeholder="Choose a technician"
            options={options.map((t) => ({ value: t.id, label: t.name }))}
            value={technicianId}
            onChange={(e) => {
              setTechnicianId(e.target.value);
              setError(undefined);
            }}
            error={error ?? fieldErrorsOf(assign.error).technicianId}
          />
          <Button
            className="mt-4 w-full"
            variant={reassign ? 'ghost' : 'primary'}
            loading={assign.isPending}
            onClick={() => (technicianId ? assign.mutate({ technicianId }) : setError('Choose a technician'))}
          >
            <UserCheck className="size-4" aria-hidden />
            {reassign ? 'Reassign' : 'Assign'}
          </Button>
        </>
      )}
    </Card>
  );
}

function VisitSummary({ d }: { d: ServiceRequestDetail }) {
  const open = d.visits.find((v) => v.status === 'pending' || v.status === 'confirmed');
  if (!['assigned', 'in_progress', 'completed'].includes(d.status) && !d.visits.length) return null;
  return (
    <Card className="animate-fade-up">
      <SectionTitle>Visit</SectionTitle>
      {open ? (
        <div className="flex items-center gap-3">
          {open.status === 'confirmed' ? <CalendarCheck className="size-5" aria-hidden /> : <CalendarClock className="size-5" aria-hidden />}
          <div>
            <div className="font-medium">{formatVisit(open.proposedAt)}</div>
            <div className="text-sm text-muted">{open.status === 'confirmed' ? 'Confirmed by customer' : 'Waiting for the customer to confirm'}</div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">{d.status === 'assigned' ? 'The technician has not proposed a visit time yet.' : 'No visit scheduled.'}</p>
      )}
      <VisitHistory visits={d.visits} />
    </Card>
  );
}

export function CenterRequestPage() {
  const { requestId = '' } = useParams();
  const request = useServiceRequest(requestId);
  const accept = useRequestAction(requestId, 'accept');
  const [rejecting, setRejecting] = useState(false);

  if (request.isPending) return <Skeleton className="h-96" />;
  if (request.isError) return <FormError message={request.error.message} />;
  const d = request.data;

  let actions;
  if (d.status === 'new') {
    actions = (
      <Card className="animate-fade-up">
        <SectionTitle>Decide on this request</SectionTitle>
        <FormError message={accept.error?.message} />
        <div className="flex flex-col gap-3">
          <Button onClick={() => accept.mutate(undefined)} loading={accept.isPending}>
            Accept request
          </Button>
          <Button variant="ghost" onClick={() => setRejecting(true)}>
            Reject
          </Button>
        </div>
      </Card>
    );
  } else if (d.status === 'accepted' || d.status === 'assigned') {
    actions = <AssignPanel d={d} />;
  }

  return (
    <>
      <RequestDetailView
        detail={d}
        perspective="center"
        back={{ to: '/center', label: 'Service requests' }}
        actions={actions}
        visitSection={<VisitSummary d={d} />}
      />
      <RejectModal open={rejecting} onClose={() => setRejecting(false)} requestId={d.id} />
    </>
  );
}
