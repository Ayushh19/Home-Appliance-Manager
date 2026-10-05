import { assetLabel, type AssetSummary } from '@ham/shared';
import { ChevronRight, Package, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useActiveAssets, useHomeAssets } from '../lib/queries';
import { FormError } from '../ui/Alert';
import { buttonClass } from '../ui/Button';
import { categoryIcon } from '../ui/categoryIcon';
import { EmptyState } from '../ui/EmptyState';
import { fieldClass } from '../ui/fieldStyles';
import { Modal } from '../ui/Modal';
import { Skeleton } from '../ui/Skeleton';
import type { RequestOrigin } from './requestOrigin';

/**
 * First step of requesting service from the overview or the Service requests page: choose the appliance,
 * then continue to the usual request form. With `homeId`, only that home's appliances are listed.
 */
export function AssetPickerModal({
  open,
  onClose,
  homeId,
  from,
}: {
  open: boolean;
  onClose: () => void;
  homeId?: string;
  from: RequestOrigin;
}) {
  const navigate = useNavigate();
  const homeAssets = useHomeAssets(open && homeId ? homeId : '');
  const allAssets = useActiveAssets(open && !homeId);
  const query = homeId ? homeAssets : allAssets;
  const [search, setSearch] = useState('');
  useEffect(() => {
    if (open) setSearch('');
  }, [open]);

  // Retired and replaced appliances can't get service, so they're not offered.
  const groups = useMemo(() => {
    const term = search.trim().toLowerCase();
    const matches = (query.data ?? []).filter(
      (a) =>
        a.status === 'active' &&
        (!term || [a.name, a.brand, a.category, a.model, a.homeName].some((v) => v?.toLowerCase().includes(term))),
    );
    const byHome = new Map<string, { name: string; assets: AssetSummary[] }>();
    for (const a of matches) {
      if (!byHome.has(a.homeId)) byHome.set(a.homeId, { name: a.homeName, assets: [] });
      byHome.get(a.homeId)!.assets.push(a);
    }
    return [...byHome.values()];
  }, [query.data, search]);
  const total = (query.data ?? []).filter((a) => a.status === 'active').length;

  const choose = (asset: AssetSummary) => navigate(`/app/assets/${asset.id}/request`, { state: { from } });

  return (
    <Modal open={open} onClose={onClose} title="Which appliance needs service?">
      {query.isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      ) : query.isError ? (
        <FormError message="Could not load your appliances." />
      ) : total === 0 ? (
        <EmptyState
          icon={Package}
          title="No appliances in use"
          description="Add the appliance first, then request service for it."
          action={
            <Link to={homeId ? `/app/homes/${homeId}/assets/new` : '/app/homes'} className={buttonClass()}>
              {homeId ? 'Add an appliance' : 'Go to homes'}
            </Link>
          }
        />
      ) : (
        <>
          {total > 5 && (
            <div className="relative mb-4">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
              <input
                type="search"
                aria-label="Search appliances"
                placeholder="Search by name, brand or type"
                className={`${fieldClass()} pl-10`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          )}
          {groups.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No appliances match “{search}”.</p>
          ) : (
            <div className="-mx-6 max-h-[60dvh] overflow-y-auto sm:-mx-8">
              {groups.map((g) => (
                <section key={g.name}>
                  {!homeId && (
                    <h3 className="bg-surface-raised px-6 py-2 text-xs font-medium tracking-[0.12em] text-muted uppercase sm:px-8">{g.name}</h3>
                  )}
                  <ul className="divide-y divide-line/70">
                    {g.assets.map((a) => {
                      const Icon = categoryIcon(a.category);
                      return (
                        <li key={a.id}>
                          <button
                            type="button"
                            onClick={() => choose(a)}
                            className="flex w-full items-center gap-4 px-6 py-3 text-left transition-colors duration-200 hover:bg-surface-raised sm:px-8"
                          >
                            <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-surface shadow-neu-sm">
                              <Icon className="size-4" aria-hidden />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-medium">{assetLabel(a)}</span>
                              <span className="block truncate text-xs text-muted">
                                {a.name && `${a.brand} ${a.category}`}
                                {a.name && a.model && ' · '}
                                {a.model && <span className="font-mono">{a.model}</span>}
                              </span>
                            </span>
                            <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
