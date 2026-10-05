import { Store } from 'lucide-react';
import { Link } from 'react-router';
import { useMe } from '../auth/useAuth';
import { AppLayout } from './AppLayout';

export function CenterLayout() {
  const { data: user } = useMe();
  const closed = user?.serviceCenter?.closed;
  return (
    <AppLayout
      nav={[
        { to: '/center', label: 'Requests', end: true, match: (p) => p === '/center' || p.startsWith('/center/requests') },
        { to: '/center/team', label: 'Team' },
        { to: '/center/settings', label: 'Center' },
      ]}
      banner={
        closed ? (
          <div role="status" className="border-b border-line/60 bg-blush">
            <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-3 gap-y-1 px-6 py-2.5 text-sm">
              <Store className="size-4 shrink-0" aria-hidden />
              <span>Your center is closed. Customers can't send you requests and your technicians can't sign in.</span>
              <Link to="/center/settings" className="font-medium underline underline-offset-4">
                Reopen
              </Link>
            </div>
          </div>
        ) : undefined
      }
    />
  );
}
