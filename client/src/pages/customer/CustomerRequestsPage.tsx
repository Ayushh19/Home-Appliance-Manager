import { RequestListPage } from '../../requests/RequestListPage';

export function CustomerRequestsPage() {
  return (
    <RequestListPage
      title="Service requests"
      subtitle="Requests you've raised for your assets. To request service, open the asset and choose Request service."
      perspective="customer"
      linkTo={(id) => `/app/requests/${id}`}
      tabs={[
        {
          value: 'open',
          label: 'Open',
          statuses: ['new', 'accepted', 'assigned', 'in_progress', 'rejected'],
          empty: 'No open requests. To request service, open an asset and choose Request service.',
        },
        { value: 'closed', label: 'Completed and cancelled', statuses: ['completed', 'cancelled'], empty: 'No completed or cancelled requests yet.' },
      ]}
    />
  );
}
