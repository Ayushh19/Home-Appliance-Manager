import type { ServiceCenterOption } from '@ham/shared';
import { MapPin, Phone } from 'lucide-react';

/** Radio cards for choosing a service center. */
export function CenterPicker({
  centers,
  value,
  onChange,
  error,
}: {
  centers: ServiceCenterOption[];
  value: string;
  onChange: (id: string) => void;
  error?: string;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium tracking-wide">Service center</legend>
      <div className="space-y-3">
        {centers.map((c) => {
          const on = value === c.id;
          return (
            <label
              key={c.id}
              className={
                'flex cursor-pointer items-start gap-3 rounded-sm px-4 py-3 transition-[box-shadow,background-color] duration-200 ' +
                'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent-strong ' +
                (on ? 'bg-accent shadow-neu-inset' : 'bg-surface shadow-neu-sm hover:bg-surface-raised')
              }
            >
              <input type="radio" name="service-center" value={c.id} checked={on} onChange={() => onChange(c.id)} className="mt-1.5 accent-accent-strong" />
              <span className="min-w-0">
                <span className="block font-medium">{c.name}</span>
                <span className="mt-0.5 flex items-start gap-1.5 text-sm text-muted">
                  <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {c.address}
                </span>
                <span className="flex items-center gap-1.5 font-mono text-xs text-muted">
                  <Phone className="size-3" aria-hidden /> {c.phone}
                </span>
              </span>
            </label>
          );
        })}
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </fieldset>
  );
}
