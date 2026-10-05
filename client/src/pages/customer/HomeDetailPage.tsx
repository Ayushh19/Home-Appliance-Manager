import { ASSET_STATUS_LABELS, type AssetSummary, assetLabel } from '@ham/shared';
import { Archive, ChevronRight, LayoutDashboard, Package, Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { formatDate } from '../../lib/format';
import { useHome, useHomeAssets } from '../../lib/queries';
import { FormError } from '../../ui/Alert';
import { Badge } from '../../ui/Badge';
import { Button, buttonClass } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { categoryIcon } from '../../ui/categoryIcon';
import { EmptyState } from '../../ui/EmptyState';
import { PageHeader } from '../../ui/PageHeader';
import { Skeleton } from '../../ui/Skeleton';
import { HomeFormModal } from './HomeFormModal';

function AssetRow({ asset, index }: { asset: AssetSummary; index: number }) {
  const Icon = categoryIcon(asset.category);
  const inactive = asset.status !== 'active';
  return (
    <li className="animate-fade-up" style={{ animationDelay: `${index * 80}ms` }}>
      <Link
        to={`/app/assets/${asset.id}`}
        className="group flex items-center gap-4 px-6 py-4 transition-colors duration-200 hover:bg-surface-raised"
      >
        <div
          className={`grid size-11 shrink-0 place-items-center rounded-sm ${inactive ? 'bg-surface-raised text-muted' : 'bg-surface shadow-neu-sm'}`}
        >
          <Icon className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className={`font-medium ${inactive ? 'text-muted' : ''}`}>{assetLabel(asset)}</div>
          <div className="truncate text-sm text-muted">
            {asset.name && `${asset.brand} ${asset.category} · `}
            {asset.model ? <span className="font-mono text-xs">{asset.model}</span> : 'No model added'}
            {asset.purchaseDate && <> · Bought {formatDate(asset.purchaseDate)}</>}
          </div>
        </div>
        {inactive && <Badge>{ASSET_STATUS_LABELS[asset.status]}</Badge>}
        <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
      </Link>
    </li>
  );
}

export function HomeDetailPage() {
  const { homeId = '' } = useParams();
  const home = useHome(homeId);
  const assets = useHomeAssets(homeId);
  const [editing, setEditing] = useState(false);

  if (home.isError) return <FormError message={home.error.message} />;

  const active = assets.data?.filter((a) => a.status === 'active') ?? [];
  const inactive = assets.data?.filter((a) => a.status !== 'active') ?? [];
  const addAsset = (
    <Link
      to={`/app/homes/${homeId}/assets/new`}
      className={buttonClass()}
    >
      <Plus className="size-4" aria-hidden />
      Add asset
    </Link>
  );

  return (
    <>
      <PageHeader
        back={{ to: '/app/homes', label: 'All homes' }}
        title={home.data?.name ?? <Skeleton className="h-10 w-64" />}
        subtitle={home.data?.address}
        actions={
          <>
            <Link to={`/app?home=${homeId}`} className={buttonClass('ghost')}>
              <LayoutDashboard className="size-4" aria-hidden />
              Overview
            </Link>
            <Button variant="ghost" onClick={() => setEditing(true)} disabled={!home.data}>
              <Pencil className="size-4" aria-hidden />
              Edit home
            </Button>
            {addAsset}
          </>
        }
      />

      {assets.isPending ? (
        <Skeleton className="h-48" />
      ) : assets.isError ? (
        <FormError message="Could not load assets." />
      ) : assets.data.length === 0 ? (
        <Card className="animate-fade-up">
          <EmptyState
            icon={Package}
            title="No assets yet"
            description="Add the appliances and devices in this home, like your AC, refrigerator or water purifier."
            action={addAsset}
          />
        </Card>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-xs font-medium tracking-[0.12em] text-muted uppercase">
              In use · <span className="font-mono">{active.length}</span>
            </h2>
            {active.length ? (
              <Card padded={false} className="overflow-hidden">
                <ul className="divide-y divide-line/70">
                  {active.map((a, i) => (
                    <AssetRow key={a.id} asset={a} index={i} />
                  ))}
                </ul>
              </Card>
            ) : (
              <p className="text-sm text-muted">Nothing in use right now.</p>
            )}
          </section>

          {inactive.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-1.5 text-xs font-medium tracking-[0.12em] text-muted uppercase">
                <Archive className="size-3.5" aria-hidden />
                Retired and replaced · <span className="font-mono">{inactive.length}</span>
              </h2>
              <Card padded={false} className="overflow-hidden">
                <ul className="divide-y divide-line/70">
                  {inactive.map((a, i) => (
                    <AssetRow key={a.id} asset={a} index={i} />
                  ))}
                </ul>
              </Card>
            </section>
          )}
        </div>
      )}

      <HomeFormModal open={editing} onClose={() => setEditing(false)} home={home.data} />
    </>
  );
}
