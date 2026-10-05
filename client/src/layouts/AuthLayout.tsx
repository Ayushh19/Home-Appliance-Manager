import { House } from 'lucide-react';
import type { ReactNode } from 'react';

/** Split screen on desktop (intro left, form right); stacked on mobile. */
export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="mx-auto grid min-h-[100dvh] max-w-[1280px] items-center gap-10 px-6 py-10 md:grid-cols-[5fr_7fr] md:gap-16">
      <div className="animate-fade-up">
        <div className="mb-6 grid size-14 place-items-center rounded-sm bg-surface shadow-neu">
          <House className="size-6" aria-hidden />
        </div>
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">Home Appliance Manager</p>
        <h1 className="mt-2 text-[2.25rem] font-bold">{title}</h1>
        <p className="mt-3 max-w-[44ch] text-muted">{subtitle}</p>
      </div>
      <div className="animate-fade-up [animation-delay:80ms]">{children}</div>
    </div>
  );
}
