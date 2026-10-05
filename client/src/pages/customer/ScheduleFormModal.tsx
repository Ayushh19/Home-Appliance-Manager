import { addMonths, maintenanceScheduleSchema, type MaintenanceSchedule, type MaintenanceScheduleInput } from '@ham/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';
import { api, fieldErrorsOf } from '../../lib/api';
import { todayIso } from '../../lib/format';
import { validate } from '../../lib/form';
import { keys } from '../../lib/queries';
import { FormError } from '../../ui/Alert';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { TextField } from '../../ui/TextField';

const PRESETS = [3, 6, 12];
const DEFAULT_INTERVAL = 6;

/** Add a maintenance schedule to an asset, or edit one when `schedule` is given. */
export function ScheduleFormModal({
  open,
  onClose,
  assetId,
  schedule,
}: {
  open: boolean;
  onClose: () => void;
  assetId: string;
  schedule?: MaintenanceSchedule;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: '', intervalMonths: '', nextDueDate: '' });
  // While adding, the due date follows the interval until the user picks a date themselves.
  const [dateTouched, setDateTouched] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm({
        title: schedule?.title ?? '',
        intervalMonths: String(schedule?.intervalMonths ?? DEFAULT_INTERVAL),
        nextDueDate: schedule?.nextDueDate ?? addMonths(todayIso(), DEFAULT_INTERVAL),
      });
      setDateTouched(Boolean(schedule));
      setErrors({});
    }
  }, [open, schedule]);

  const changeInterval = (value: string) => {
    const months = Number(value);
    setForm((f) => ({
      ...f,
      intervalMonths: value,
      nextDueDate: !dateTouched && Number.isInteger(months) && months > 0 ? addMonths(todayIso(), months) : f.nextDueDate,
    }));
  };

  const save = useMutation({
    mutationFn: (input: MaintenanceScheduleInput) =>
      schedule
        ? api(`/maintenance-schedules/${schedule.id}`, { method: 'PATCH', body: input })
        : api(`/assets/${assetId}/maintenance-schedules`, { method: 'POST', body: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.asset(assetId) });
      queryClient.invalidateQueries({ queryKey: keys.reminders });
      onClose();
    },
    onError: (err) => setErrors(fieldErrorsOf(err)),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = validate(maintenanceScheduleSchema, form);
    setErrors(result.errors ?? {});
    if (result.data) save.mutate(result.data);
  };

  return (
    <Modal open={open} onClose={onClose} title={schedule ? 'Edit schedule' : 'Add maintenance schedule'}>
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <FormError message={save.error?.message} />
        <TextField
          label="What needs doing"
          placeholder="e.g. AC servicing, filter change"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          error={errors.title}
          autoFocus
        />
        <div>
          <TextField
            label="Repeat every (months)"
            type="number"
            inputMode="numeric"
            min="1"
            max="120"
            step="1"
            className="[&_input]:font-mono"
            value={form.intervalMonths}
            onChange={(e) => changeInterval(e.target.value)}
            error={errors.intervalMonths}
          />
          <div className="mt-2.5 flex flex-wrap gap-2" role="group" aria-label="Common intervals">
            {PRESETS.map((m) => {
              const on = form.intervalMonths === String(m);
              return (
                <button
                  key={m}
                  type="button"
                  aria-pressed={on}
                  onClick={() => changeInterval(String(m))}
                  className={
                    'rounded-sm px-3 py-1.5 text-sm transition-[box-shadow,background-color] duration-200 ' +
                    (on ? 'bg-accent font-medium shadow-neu-inset' : 'bg-surface shadow-neu-sm hover:bg-surface-raised')
                  }
                >
                  {m === 12 ? 'Every year' : `Every ${m} months`}
                </button>
              );
            })}
          </div>
        </div>
        <TextField
          label="Next due on"
          type="date"
          hint={schedule ? undefined : 'Set to when the next service is actually due, if you know it.'}
          value={form.nextDueDate}
          onChange={(e) => {
            setDateTouched(true);
            setForm({ ...form, nextDueDate: e.target.value });
          }}
          error={errors.nextDueDate}
        />
        <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={save.isPending}>
            {schedule ? 'Save changes' : 'Add schedule'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
