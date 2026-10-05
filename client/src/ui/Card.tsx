import type { HTMLAttributes } from 'react';

export function Card({ className = '', padded = true, ...props }: HTMLAttributes<HTMLDivElement> & { padded?: boolean }) {
  return (
    <div
      className={`rounded-sm border border-white/60 bg-surface shadow-card ${padded ? 'p-6 sm:p-8' : ''} ${className}`}
      {...props}
    />
  );
}
