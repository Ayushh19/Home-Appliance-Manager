import type { ReactNode } from 'react';

type Tone = 'accent' | 'blush' | 'neutral';

const tones: Record<Tone, string> = {
  accent: 'bg-accent text-ink',
  blush: 'bg-blush text-ink',
  neutral: 'bg-surface-raised text-muted border border-line',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-sm px-2.5 py-0.5 text-xs font-medium tracking-wide ${tones[tone]}`}>
      {children}
    </span>
  );
}
