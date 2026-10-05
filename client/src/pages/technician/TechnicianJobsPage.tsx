import { RequestListPage } from '../../requests/RequestListPage';

export function TechnicianJobsPage() {
  return (
    <RequestListPage
      title="My jobs"
      subtitle="Service requests your center has assigned to you."
      perspective="technician"
      linkTo={(id) => `/technician/jobs/${id}`}
      tabs={[
        { value: 'todo', label: 'To do', statuses: ['assigned', 'in_progress'], empty: 'No jobs assigned to you right now.' },
        { value: 'done', label: 'Completed', statuses: ['completed'], empty: 'No completed jobs yet.' },
      ]}
    />
  );
}
