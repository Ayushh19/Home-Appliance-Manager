import { Plus } from 'lucide-react';
import { useState } from 'react';
import { AssetPickerModal } from '../../requests/AssetPickerModal';
import { RequestListPage } from '../../requests/RequestListPage';
import { RequestSentNotice } from '../../requests/RequestSentNotice';
import { Button } from '../../ui/Button';

export function CustomerRequestsPage() {
  const [picking, setPicking] = useState(false);
  const requestButton = (
    <Button onClick={() => setPicking(true)}>
      <Plus className="size-4" aria-hidden />
      Request service
    </Button>
  );

  return (
    <>
      <RequestListPage
        title="Service requests"
        subtitle="Requests you've raised for your appliances."
        perspective="customer"
        linkTo={(id) => `/app/requests/${id}`}
        actions={requestButton}
        notice={<RequestSentNotice />}
        tabs={[
          {
            value: 'open',
            label: 'Open',
            statuses: ['new', 'accepted', 'assigned', 'in_progress', 'rejected'],
            empty: 'No open requests.',
          },
          { value: 'closed', label: 'Completed and cancelled', statuses: ['completed', 'cancelled'], empty: 'No completed or cancelled requests yet.' },
        ]}
      />
      <AssetPickerModal open={picking} onClose={() => setPicking(false)} from={{ to: '/app/requests', label: 'Service requests' }} />
    </>
  );
}
