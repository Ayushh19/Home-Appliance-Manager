import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

export function PageHeader({
  title,
  subtitle,
  back,
  actions,
  leading,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  back?: { to: string; label: string };
  actions?: ReactNode;
  leading?: ReactNode;
}) {
  return (
    <div className="mb-8 animate-fade-up">
      {back && (
        <Link
          to={back.to}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted transition-colors duration-200 hover:text-ink"
        >
          <ChevronLeft className="size-4" aria-hidden />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
        {leading}
        <div className="min-w-0 flex-1">
          <h1 className="text-[2.25rem] font-bold break-words">{title}</h1>
          {subtitle && <div className="mt-1 text-muted">{subtitle}</div>}
        </div>
        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>
    </div>
  );
}
