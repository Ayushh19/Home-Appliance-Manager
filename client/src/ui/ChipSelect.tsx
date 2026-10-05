import { Check } from 'lucide-react';
import type { CatalogItem } from '@ham/shared';

/** Multi-select rendered as toggle chips. Selected chips look pressed in. */
export function ChipSelect({
  label,
  items,
  selected,
  onChange,
  error,
}: {
  label: string;
  items: CatalogItem[];
  selected: string[];
  onChange: (ids: string[]) => void;
  error?: string;
}) {
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);

  return (
    <fieldset>
      <legend className="mb-2 flex w-full items-baseline justify-between text-sm font-medium tracking-wide">
        <span>{label}</span>
        <span className="font-mono text-xs text-muted">{selected.length} selected</span>
      </legend>
      <div className="flex flex-wrap gap-2.5">
        {items.map((item) => {
          const on = selected.includes(item.id);
          return (
            <label
              key={item.id}
              className={
                'inline-flex cursor-pointer select-none items-center gap-1.5 rounded-sm px-3.5 py-2 text-sm ' +
                'transition-[box-shadow,background-color] duration-200 ease-out has-[:focus-visible]:outline-2 ' +
                'has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent-strong ' +
                (on ? 'bg-accent font-medium shadow-neu-inset' : 'bg-surface shadow-neu-sm hover:bg-surface-raised')
              }
            >
              <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(item.id)} />
              {on && <Check className="size-3.5" aria-hidden />}
              {item.name}
            </label>
          );
        })}
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </fieldset>
  );
}
