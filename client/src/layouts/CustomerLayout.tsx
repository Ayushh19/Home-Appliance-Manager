import { useReminders } from '../lib/queries';
import { AppLayout } from './AppLayout';

export function CustomerLayout() {
  const reminders = useReminders();
  return (
    <AppLayout
      nav={[
        { to: '/app', label: 'Overview', end: true },
        { to: '/app/homes', label: 'Homes', match: (p) => p.startsWith('/app/homes') || p.startsWith('/app/assets') },
        { to: '/app/requests', label: 'Service requests' },
        { to: '/app/reminders', label: 'Reminders', badge: reminders.data?.unreadCount },
      ]}
    />
  );
}
