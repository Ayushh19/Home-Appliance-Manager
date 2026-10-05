import { useMe } from '../../auth/useAuth';
import { RequestListPage } from '../../requests/RequestListPage';

export function CenterRequestsPage() {
  const { data: user } = useMe();
  return (
    <RequestListPage
      title="Service requests"
      subtitle={`Requests customers have sent to ${user?.serviceCenter?.name ?? 'your center'}.`}
      perspective="center"
      linkTo={(id) => `/center/requests/${id}`}
      tabs={[
        { value: 'new', label: 'New', statuses: ['new'], empty: 'No new requests waiting for a decision.' },
        {
          value: 'active',
          label: 'In progress',
          statuses: ['accepted', 'assigned', 'in_progress'],
          empty: 'No accepted requests in progress.',
        },
        {
          value: 'closed',
          label: 'Closed',
          statuses: ['completed', 'rejected', 'cancelled'],
          empty: 'No completed, rejected or cancelled requests.',
        },
      ]}
    />
  );
}
