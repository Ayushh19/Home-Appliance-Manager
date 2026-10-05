import { ASSET_STATUS_LABELS, assetLabel } from '@ham/shared';
import { Archive, Pencil } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { formatDate, formatMoney } from '../../lib/format';
import { useAsset } from '../../lib/queries';
import { FormError } from '../../ui/Alert';
import { Badge } from '../../ui/Badge';
import { Button, buttonClass } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { categoryIcon } from '../../ui/categoryIcon';
import { PageHeader } from '../../ui/PageHeader';
import { Skeleton } from '../../ui/Skeleton';
import { DocumentsSection } from './DocumentsSection';
import { MaintenanceSection } from './MaintenanceSection';
import { AssetTimeline } from './AssetTimeline';
import { ServiceRequestsSection } from './ServiceSections';
import { StatusModal } from './StatusModal';
import { WarrantiesSection } from './WarrantiesSection';

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-[0.08em] text-muted uppercase">{label}</dt>
      <dd className="mt-1 break-words">{children}</dd>
    </div>
  );
}

export function AssetPage() {
  const { assetId = '' } = useParams();
  const asset = useAsset(assetId);
  const [changingStatus, setChangingStatus] = useState(false);

  if (asset.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-80" />
        <div className="grid gap-6 md:grid-cols-[7fr_5fr]">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }
  if (asset.isError) return <FormError message={asset.error.message} />;

  const a = asset.data;
  const Icon = categoryIcon(a.category);
  const inactive = a.status !== 'active';
  const missing = <span className="text-muted">Not added</span>;

  return (
    <>
      <PageHeader
        back={{ to: `/app/homes/${a.home.id}`, label: a.home.name }}
        leading={
          <div className="grid size-16 shrink-0 place-items-center rounded-md bg-surface shadow-neu">
            <Icon className="size-7" aria-hidden />
          </div>
        }
        title={assetLabel(a)}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            {a.name && (
              <span>
                {a.brand} {a.category}
              </span>
            )}
            {a.model && <span className="font-mono text-sm">{a.model}</span>}
            <Badge tone={inactive ? 'neutral' : 'accent'}>{ASSET_STATUS_LABELS[a.status]}</Badge>
            {inactive && a.statusChangedAt && <span className="text-sm">since {formatDate(a.statusChangedAt)}</span>}
          </span>
        }
        actions={
          <>
            <Button variant="ghost" onClick={() => setChangingStatus(true)}>
              <Archive className="size-4" aria-hidden />
              Change status
            </Button>
            <Link to={`/app/assets/${a.id}/edit`} className={buttonClass('ghost')}>
              <Pencil className="size-4" aria-hidden />
              Edit details
            </Link>
          </>
        }
      />

      <div className="grid items-start gap-6 md:grid-cols-[7fr_5fr]">
        <div className="space-y-6">
          <Card className="animate-fade-up">
            <h2 className="text-[1.5rem] font-bold">Details</h2>
            <dl className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
              <Detail label="Type">{a.category}</Detail>
              <Detail label="Brand">{a.brand}</Detail>
              <Detail label="Model">{a.model ? <span className="font-mono text-sm">{a.model}</span> : missing}</Detail>
              <Detail label="Serial number">
                {a.serialNumber ? <span className="font-mono text-sm">{a.serialNumber}</span> : missing}
              </Detail>
              <Detail label="Purchase date">{a.purchaseDate ? formatDate(a.purchaseDate) : missing}</Detail>
              <Detail label="Purchase price">
                {a.purchasePrice != null ? <span className="font-mono text-sm">{formatMoney(a.purchasePrice)}</span> : missing}
              </Detail>
              {a.notes && (
                <div className="sm:col-span-2">
                  <Detail label="Notes">
                    <span className="whitespace-pre-line">{a.notes}</span>
                  </Detail>
                </div>
              )}
            </dl>
          </Card>
          <ServiceRequestsSection asset={a} />
          <AssetTimeline asset={a} />
          <DocumentsSection assetId={a.id} documents={a.documents} />
        </div>
        <div className="space-y-6">
          <MaintenanceSection assetId={a.id} schedules={a.maintenanceSchedules} />
          <WarrantiesSection assetId={a.id} warranties={a.warranties} purchaseDate={a.purchaseDate} />
        </div>
      </div>

      <StatusModal open={changingStatus} onClose={() => setChangingStatus(false)} assetId={a.id} current={a.status} />
    </>
  );
}
