import { CheckCircle2, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import type { RequestSent } from './requestOrigin';

/** "Request sent" message on the page the customer started from (docs/DECISIONS.md #38). */
export function RequestSentNotice() {
  const location = useLocation();
  const navigate = useNavigate();
  const sent = (location.state as { requestSent?: RequestSent } | null)?.requestSent;
  if (!sent) return null;

  const dismiss = () => navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
  return (
    <div role="status" className="mb-6 flex animate-fade-up items-center gap-3 rounded-sm bg-accent px-5 py-3 text-sm">
      <CheckCircle2 className="size-4 shrink-0" aria-hidden />
      <span className="flex-1">
        Service request sent for {sent.assetLabel}.{' '}
        <Link to={`/app/requests/${sent.requestId}`} className="font-medium underline underline-offset-4">
          View request
        </Link>
      </span>
      <button type="button" onClick={dismiss} aria-label="Dismiss" className="grid size-7 place-items-center rounded-sm hover:bg-accent-hover">
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
