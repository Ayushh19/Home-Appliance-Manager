import type { UserRole } from '@ham/shared';
import { Navigate, Outlet } from 'react-router';
import { Skeleton } from '../ui/Skeleton';
import { HOME_PATH, useMe } from './useAuth';

function FullPageSkeleton() {
  return (
    <div className="mx-auto max-w-[1280px] space-y-4 px-6 py-10">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

/** Only signed-in users with one of the given roles; others go to their own home or to sign in. */
export function RequireRole({ role }: { role: UserRole }) {
  const me = useMe();
  if (me.isPending) return <FullPageSkeleton />;
  if (!me.data) return <Navigate to="/login" replace />;
  if (me.data.role !== role) return <Navigate to={HOME_PATH[me.data.role]} replace />;
  return <Outlet />;
}

/** Sign-in and registration pages; signed-in users are sent to their home. */
export function GuestOnly() {
  const me = useMe();
  if (me.isPending) return <FullPageSkeleton />;
  if (me.data) return <Navigate to={HOME_PATH[me.data.role]} replace />;
  return <Outlet />;
}

export function RootRedirect() {
  const me = useMe();
  if (me.isPending) return <FullPageSkeleton />;
  return <Navigate to={me.data ? HOME_PATH[me.data.role] : '/login'} replace />;
}
