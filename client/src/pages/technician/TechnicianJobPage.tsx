import {
  completeServiceRequestSchema,
  progressNoteSchema,
  proposeVisitSchema,
  type CompleteServiceRequestInput,
  type ServiceRequestDetail,
} from '@ham/shared';
import { CalendarCheck, CalendarClock, CheckCircle2, Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { fieldErrorsOf } from '../../lib/api';
import { validate } from '../../lib/form';
import { useServiceRequest } from '../../lib/queries';
import { formatVisit } from '../../requests/format';
import { RequestDetailView, SectionTitle, VisitHistory } from '../../requests/RequestDetailView';
import { useRequestAction } from '../../requests/useRequestAction';
import { FormError } from '../../ui/Alert';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Modal } from '../../ui/Modal';
import { Skeleton } from '../../ui/Skeleton';
import { TextAreaField } from '../../ui/TextAreaField';
import { TextField } from '../../ui/TextField';

/** "YYYY-MM-DDTHH:mm" for <input type="datetime-local"> in local time. */
function localInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function VisitPanel({ d }: { d: ServiceRequestDetail }) {
  const pending = d.visits.find((v) => v.status === 'pending');
  const confirmed = d.visits.find((v) => v.status === 'confirmed');
  const [when, setWhen] = useState('');
  const [error, setError] = useState<string>();
  const propose = useRequestAction<{ proposedAt: string }>(d.id, 'visits', () => setWhen(''));
  const declinedLast = !pending && !confirmed && d.visits[0]?.status === 'declined';

  const submit = () => {
    const proposedAt = when ? new Date(when).toISOString() : '';
    const result = validate(proposeVisitSchema, { proposedAt });
    setError(result.errors?.proposedAt);
    if (result.data) propose.mutate(result.data, { onError: (err) => setError(fieldErrorsOf(err).proposedAt) });
  };

  return (
    <Card className="animate-fade-up">
      <SectionTitle>Visit</SectionTitle>
      {confirmed ? (
        <div className="flex items-center gap-3">
          <CalendarCheck className="size-5" aria-hidden />
          <div>
            <div className="font-medium">{formatVisit(confirmed.proposedAt)}</div>
            <div className="text-sm text-muted">Confirmed by the customer</div>
          </div>
        </div>
      ) : pending ? (
        <div className="flex items-center gap-3">
          <CalendarClock className="size-5" aria-hidden />
          <div>
            <div className="font-medium">{formatVisit(pending.proposedAt)}</div>
            <div className="text-sm text-muted">Waiting for the customer to confirm</div>
          </div>
        </div>
      ) : d.status === 'assigned' ? (
        <div>
          <p className="mb-4 text-sm text-muted">
            {declinedLast ? 'The customer is not available at the time you proposed. Propose another time.' : 'Propose a time to visit the customer.'}
          </p>
          <FormError message={propose.error && !fieldErrorsOf(propose.error).proposedAt ? propose.error.message : undefined} />
          <TextField
            label="Date and time"
            type="datetime-local"
            min={localInputValue(new Date())}
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            error={error}
          />
          <Button className="mt-4 w-full sm:w-auto" loading={propose.isPending} onClick={submit}>
            Propose visit time
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted">No visit scheduled.</p>
      )}
      <VisitHistory visits={d.visits} />
    </Card>
  );
}

function CompleteModal({ open, onClose, requestId }: { open: boolean; onClose: () => void; requestId: string }) {
  const [form, setForm] = useState({ workDone: '', partsReplaced: '', cost: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const complete = useRequestAction<CompleteServiceRequestInput>(requestId, 'complete', onClose);
  useEffect(() => {
    if (open) setErrors({});
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Complete service">
      <form
        noValidate
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          const result = validate(completeServiceRequestSchema, form);
          setErrors(result.errors ?? {});
          if (result.data) complete.mutate(form, { onError: (err) => setErrors(fieldErrorsOf(err)) });
        }}
      >
        <p className="text-sm text-muted">This is added to the asset's service history. It can't be undone.</p>
        <FormError message={complete.error?.message} />
        <TextAreaField
          label="Work done"
          placeholder="e.g. Gas refilled, filters and coils cleaned"
          value={form.workDone}
          onChange={(e) => setForm({ ...form, workDone: e.target.value })}
          error={errors.workDone}
          autoFocus
        />
        <TextField
          label="Parts replaced (optional)"
          value={form.partsReplaced}
          onChange={(e) => setForm({ ...form, partsReplaced: e.target.value })}
          error={errors.partsReplaced}
        />
        <TextField
          label="Amount charged in ₹ (optional)"
          hint="Leave empty or 0 if the work was free, e.g. under warranty."
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={form.cost}
          onChange={(e) => setForm({ ...form, cost: e.target.value })}
          error={errors.cost}
        />
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={complete.isPending}>
            <CheckCircle2 className="size-4" aria-hidden />
            Mark completed
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function WorkPanel({ d }: { d: ServiceRequestDetail }) {
  const start = useRequestAction(d.id, 'start');
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState<string>();
  const addNote = useRequestAction<{ note: string }>(d.id, 'notes', () => setNote(''));
  const [completing, setCompleting] = useState(false);
  const hasConfirmedVisit = d.visits.some((v) => v.status === 'confirmed');

  return (
    <Card className="animate-fade-up">
      <SectionTitle>Work</SectionTitle>
      <FormError message={start.error?.message} />
      {d.status === 'assigned' &&
        (hasConfirmedVisit ? (
          <Button className="w-full" onClick={() => start.mutate(undefined)} loading={start.isPending}>
            <Play className="size-4" aria-hidden />
            Start work
          </Button>
        ) : (
          <p className="text-sm text-muted">You can start work once the customer confirms a visit time.</p>
        ))}
      {d.status === 'in_progress' && (
        <Button className="w-full" onClick={() => setCompleting(true)}>
          <CheckCircle2 className="size-4" aria-hidden />
          Complete service
        </Button>
      )}

      <div className="mt-6 border-t border-line/70 pt-5">
        <TextAreaField
          label="Add a progress update"
          rows={2}
          placeholder="e.g. Part ordered, will return Thursday"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          error={noteError}
        />
        <Button
          variant="ghost"
          className="mt-3 w-full"
          loading={addNote.isPending}
          onClick={() => {
            const result = validate(progressNoteSchema, { note });
            setNoteError(result.errors?.note);
            if (result.data) addNote.mutate(result.data);
          }}
        >
          Add update
        </Button>
      </div>
      <CompleteModal open={completing} onClose={() => setCompleting(false)} requestId={d.id} />
    </Card>
  );
}

export function TechnicianJobPage() {
  const { requestId = '' } = useParams();
  const request = useServiceRequest(requestId);

  if (request.isPending) return <Skeleton className="h-96" />;
  if (request.isError) return <FormError message={request.error.message} />;
  const d = request.data;

  return (
    <RequestDetailView
      detail={d}
      perspective="technician"
      back={{ to: '/technician', label: 'My jobs' }}
      actions={d.status === 'assigned' || d.status === 'in_progress' ? <WorkPanel d={d} /> : undefined}
      visitSection={<VisitPanel d={d} />}
    />
  );
}
