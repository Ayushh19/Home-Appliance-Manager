import type { AssetStatus, ServiceType } from './enums.js';
import type { ServiceRequestSummary } from './serviceRequests.js';

/** How far ahead the dashboard looks (docs/DASHBOARD.md). */
export const DASHBOARD_WINDOW_DAYS = { maintenance: 30, warranty: 30, recentService: 90 } as const;

export interface DashboardAsset {
  id: string;
  name: string | null;
  category: string;
  brand: string;
  model: string | null;
  homeName: string;
}

/** Overview of one home (docs/DECISIONS.md #32, docs/DASHBOARD.md). */
export interface Dashboard {
  home: { id: string; name: string; address: string };
  activeAssetCount: number;
  /** Service and repair costs; retired/replaced assets only with ?includeRetired=1. */
  totalSpent: number;
  spentThisYear: number;
  /** Assets with the most services, most first (top 3). Retired/replaced only with ?includeRetired=1. */
  mostServiced: { asset: DashboardAsset & { status: AssetStatus }; serviceCount: number; spent: number }[];
  /** The asset in use whose maintenance is due soonest (any distance ahead, or overdue). */
  nextService: { scheduleId: string; title: string; nextDueDate: string; asset: DashboardAsset } | null;
  /** Overdue, or due within DASHBOARD_WINDOW_DAYS.maintenance. Soonest first. */
  maintenanceDue: { scheduleId: string; title: string; nextDueDate: string; asset: DashboardAsset }[];
  /** Ending within DASHBOARD_WINDOW_DAYS.warranty. Soonest first. */
  warrantiesEnding: { warrantyId: string; endDate: string; details: string | null; asset: DashboardAsset }[];
  /** Open requests plus rejected ones waiting for the customer to pick another center. */
  activeRequests: ServiceRequestSummary[];
  /** Services in the last DASHBOARD_WINDOW_DAYS.recentService days. Newest first. */
  recentlyServiced: {
    recordId: string;
    serviceDate: string;
    type: ServiceType;
    workDone: string | null;
    cost: number | null;
    asset: DashboardAsset;
  }[];
}
