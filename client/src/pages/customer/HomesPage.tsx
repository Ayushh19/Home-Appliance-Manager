import { ChevronRight, House, MapPin, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useHomes } from '../../lib/queries';
import { FormError } from '../../ui/Alert';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { EmptyState } from '../../ui/EmptyState';
import { PageHeader } from '../../ui/PageHeader';
import { Skeleton } from '../../ui/Skeleton';
import { HomeFormModal } from './HomeFormModal';

export function HomesPage() {
  const homes = useHomes();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);

  const addButton = (
    <Button onClick={() => setAdding(true)}>
      <Plus className="size-4" aria-hidden />
      Add home
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Homes"
        subtitle="Your homes and the appliances in them."
        actions={homes.data?.length ? addButton : undefined}
      />

      {homes.isPending ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      ) : homes.isError ? (
        <FormError message="Could not load your homes." />
      ) : homes.data.length === 0 ? (
        <Card className="animate-fade-up">
          <EmptyState
            icon={House}
            title="Add your first home"
            description="Start with your home or apartment, then add the appliances and other assets inside it."
            action={addButton}
          />
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {homes.data.map((home, i) => (
            <Link
              key={home.id}
              to={`/app/homes/${home.id}`}
              style={{ animationDelay: `${i * 80}ms` }}
              className={
                'group flex animate-fade-up items-center gap-5 rounded-sm border border-white/60 bg-surface p-6 shadow-card ' +
                'transition-[box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 active:translate-y-px active:duration-150'
              }
            >
              <div className="grid size-14 shrink-0 place-items-center rounded-sm bg-accent">
                <House className="size-6" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-lg font-semibold">{home.name}</div>
                <div className="mt-0.5 flex items-center gap-1 text-sm text-muted">
                  <MapPin className="size-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{home.address}</span>
                </div>
                <div className="mt-2 text-sm">
                  <span className="font-mono">{home.activeAssetCount}</span>{' '}
                  {home.activeAssetCount === 1 ? 'asset' : 'assets'}
                  {home.inactiveAssetCount > 0 && (
                    <span className="text-muted">
                      {' '}
                      · <span className="font-mono">{home.inactiveAssetCount}</span> retired or replaced
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="size-5 shrink-0 text-muted transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
            </Link>
          ))}
        </div>
      )}

      <HomeFormModal open={adding} onClose={() => setAdding(false)} onSaved={(home) => navigate(`/app/homes/${home.id}`)} />
    </>
  );
}
