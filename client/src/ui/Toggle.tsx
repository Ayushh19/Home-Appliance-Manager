import { useId } from 'react';

/** On/off switch: an inset track with a raised knob. */
export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  const id = useId();
  return (
    <label htmlFor={id} className="inline-flex cursor-pointer items-center gap-3 text-sm select-none">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={
          'relative h-7 w-12 shrink-0 rounded-full shadow-neu-inset transition-colors duration-200 ' +
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong ' +
          (checked ? 'bg-accent' : 'bg-surface')
        }
      >
        <span
          aria-hidden
          className={
            'absolute top-1 left-1 size-5 rounded-full bg-surface-raised shadow-neu-sm transition-transform duration-200 ease-out ' +
            (checked ? 'translate-x-5' : 'translate-x-0')
          }
        />
      </button>
      <span>{label}</span>
    </label>
  );
}
