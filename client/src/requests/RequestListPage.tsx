import type { RequestStatus, ServiceRequestSummary } from '@ham/shared';
import { ClipboardList } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useServiceRequests } from '../lib/queries';
import { FormError } from '../ui/Alert';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { PageHeader } from '../ui/PageHeader';
import { Skeleton } from '../ui/Skeleton';
import { RequestList, type ListPerspective } from './RequestList';
import { Tabs } from './Tabs';

export interface TabDef {
  value: string;
  label: string;
  statuses: readonly RequestStatus[];
  empty: string;
}

/** A role's request list: tabs filter by status. */
export function RequestListPage({
  title,
  subtitle,
  tabs,
  perspective,
  linkTo,
  emptyAction,
}: {
  title: string;
  subtitle: string;
  tabs: TabDef[];
  perspective: ListPerspective;
  linkTo: (id: string) => string;
  emptyAction?: ReactNode;
}) {
  const requests = useServiceRequests();
  const [tab, setTab] = useState(tabs[0]!.value);
  const current = tabs.find((t) => t.value === tab)!;
  const filter = (t: TabDef) => (requests.data ?? []).filter((r: ServiceRequestSummary) => t.statuses.includes(r.status));
  const shown = filter(current);

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      <Tabs
        tabs={tabs.map((t) => ({ value: t.value, label: t.label, count: requests.data ? filter(t).length : undefined }))}
        value={tab}
        onChange={setTab}
      />
      {requests.isPending ? (
        <Skeleton className="h-48" />
      ) : requests.isError ? (
        <FormError message="Could not load service requests." />
      ) : shown.length === 0 ? (
        <Card className="animate-fade-up">
          <EmptyState icon={ClipboardList} title="Nothing here" description={current.empty} action={emptyAction} />
        </Card>
      ) : (
        <Card padded={false} className="overflow-hidden">
          <RequestList requests={shown} linkTo={linkTo} perspective={perspective} />
        </Card>
      )}
    </>
  );
}
