import type { ServiceRequestDetail } from '@ham/shared';

export interface TimelineEntry {
  id: string;
  at: string;
  title: string;
  detail?: string | null;
  by?: string;
}

/**
 * Merges status changes, notes and assignment events into one list, oldest first.
 * Status changes that an assignment event already describes (sent, rejected, assigned) are skipped.
 */
export function buildTimeline(d: ServiceRequestDetail): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  for (const a of d.assignments) {
    if (a.event === 'sent_to_center') entries.push({ id: a.id, at: a.createdAt, title: `Sent to ${a.centerName}`, by: a.byName });
    if (a.event === 'rejected')
      entries.push({ id: a.id, at: a.createdAt, title: `Rejected by ${a.centerName}`, detail: a.reason, by: a.byName });
    if (a.event === 'technician_assigned')
      entries.push({ id: a.id, at: a.createdAt, title: `Assigned to ${a.technicianName}`, by: a.byName });
    if (a.event === 'technician_reassigned')
      entries.push({ id: a.id, at: a.createdAt, title: `Reassigned to ${a.technicianName}`, by: a.byName });
  }

  for (const u of d.updates) {
    const by = u.user.name;
    if (!u.toStatus) {
      entries.push({ id: u.id, at: u.createdAt, title: 'Progress update', detail: u.note, by });
      continue;
    }
    if (u.toStatus === 'accepted') entries.push({ id: u.id, at: u.createdAt, title: 'Request accepted', by });
    if (u.toStatus === 'in_progress') entries.push({ id: u.id, at: u.createdAt, title: 'Work started', by });
    if (u.toStatus === 'completed') entries.push({ id: u.id, at: u.createdAt, title: 'Service completed', by });
    if (u.toStatus === 'cancelled') entries.push({ id: u.id, at: u.createdAt, title: 'Request cancelled', by });
  }

  return entries.sort((a, b) => a.at.localeCompare(b.at));
}
