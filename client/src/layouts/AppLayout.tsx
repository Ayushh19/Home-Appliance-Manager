import type { ReactNode } from 'react';
import { House, LogOut } from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { useLogout, useMe } from '../auth/useAuth';
import { Button } from '../ui/Button';

function navLinkClass(active: boolean) {
  return (
    'relative rounded-sm px-3 py-2 text-sm transition-colors duration-200 hover:bg-surface-raised ' +
    (active
      ? 'font-medium after:absolute after:inset-x-3 after:-bottom-[13px] after:h-[3px] after:rounded-full after:bg-accent-strong'
      : 'text-muted')
  );
}

const ROLE_LABEL = { customer: 'Homeowner', center_staff: 'Service center', technician: 'Technician' } as const;

export interface NavItem {
  to: string;
  label: string;
  end?: boolean;
  /** Unread count shown next to the label; hidden when 0. */
  badge?: number;
  /** Custom active check, for sections spanning several URL prefixes. */
  match?: (pathname: string) => boolean;
}

export function AppLayout({ nav, banner }: { nav: NavItem[]; banner?: ReactNode }) {
  const { data: user } = useMe();
  const logout = useLogout();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 z-[100] border-b border-line/60 bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-sm bg-surface shadow-neu-sm">
              <House className="size-4" aria-hidden />
            </div>
            <span className="font-semibold">Home Appliance Manager</span>
          </div>

          <nav aria-label="Main" className="order-last flex w-full gap-1 md:order-none md:w-auto">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                aria-current={item.match?.(pathname) ? 'page' : undefined}
                className={({ isActive }) => navLinkClass(item.match ? item.match(pathname) : isActive)}
              >
                {item.label}
                {item.badge ? (
                  <span className="ml-1.5 inline-grid min-w-5 place-items-center rounded-full bg-blush px-1.5 font-mono text-xs font-medium text-ink">
                    {item.badge}
                    <span className="sr-only"> unread</span>
                  </span>
                ) : null}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {user && (
              <div className="hidden text-right leading-tight sm:block">
                <div className="text-sm font-medium">{user.name}</div>
                <div className="text-xs text-muted">
                  {ROLE_LABEL[user.role]}
                  {user.serviceCenter ? ` · ${user.serviceCenter.name}` : ''}
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              className="px-3 py-2"
              aria-label="Sign out"
              loading={logout.isPending}
              onClick={() => logout.mutate(undefined, { onSuccess: () => navigate('/login', { replace: true }) })}
            >
              <LogOut className="size-4" aria-hidden />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>
      {banner}
      <main className="mx-auto max-w-[1280px] px-6 py-8 md:py-12">
        <Outlet />
      </main>
    </div>
  );
}
