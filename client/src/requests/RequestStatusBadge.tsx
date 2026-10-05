import { REQUEST_STATUS_LABELS, type RequestStatus } from '@ham/shared';
import { Badge } from '../ui/Badge';

const TONE: Record<RequestStatus, 'accent' | 'blush' | 'neutral'> = {
  new: 'blush',
  accepted: 'accent',
  assigned: 'accent',
  in_progress: 'accent',
  completed: 'neutral',
  rejected: 'blush',
  cancelled: 'neutral',
};

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return <Badge tone={TONE[status]}>{REQUEST_STATUS_LABELS[status]}</Badge>;
}
