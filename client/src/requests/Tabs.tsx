/** Simple segmented tabs; counts shown in mono. */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="tablist" className="mb-5 inline-flex max-w-full gap-1 overflow-x-auto rounded-sm bg-surface p-1 shadow-neu-inset">
      {tabs.map((t) => {
        const on = t.value === value;
        return (
          <button
            key={t.value}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.value)}
            className={
              'shrink-0 rounded-sm px-4 py-2 text-sm transition-[box-shadow,background-color] duration-200 ' +
              (on ? 'bg-surface font-medium shadow-neu-sm' : 'text-muted hover:text-ink')
            }
          >
            {t.label}
            {t.count !== undefined && <span className="ml-1.5 font-mono text-xs">{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
