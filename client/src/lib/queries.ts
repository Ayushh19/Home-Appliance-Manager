import type {
  AssetDetail,
  AssetSummary,
  CatalogItem,
  HomeSummary,
  ServiceCenterProfile,
  ReminderList,
  ServiceCenterOption,
  ServiceRequestDetail,
  ServiceRequestSummary,
} from '@ham/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from './api';

export const keys = {
  categories: ['catalog', 'categories'] as const,
  brands: ['catalog', 'brands'] as const,
  homes: ['homes'] as const,
  home: (id: string) => ['homes', id] as const,
  homeAssets: (id: string) => ['homes', id, 'assets'] as const,
  asset: (id: string) => ['assets', id] as const,
  reminders: ['reminders'] as const,
  activeAssets: ['assets', 'active'] as const,
  dashboard: ['dashboard'] as const,
  serviceRequests: ['service-requests'] as const,
  serviceRequest: (id: string) => ['service-requests', id] as const,
  serviceCenters: (assetId: string, requestId?: string) => ['service-centers', assetId, requestId ?? null] as const,
  technicians: ['center', 'technicians'] as const,
  centerProfile: ['center', 'profile'] as const,
};

export const useCategories = () =>
  useQuery({ queryKey: keys.categories, queryFn: () => api<CatalogItem[]>('/catalog/categories'), staleTime: Infinity });

export const useBrands = () =>
  useQuery({ queryKey: keys.brands, queryFn: () => api<CatalogItem[]>('/catalog/brands'), staleTime: Infinity });

export const useHomes = () => useQuery({ queryKey: keys.homes, queryFn: () => api<HomeSummary[]>('/homes') });

export const useHome = (id: string) =>
  useQuery({ queryKey: keys.home(id), queryFn: () => api<{ id: string; name: string; address: string }>(`/homes/${id}`), enabled: Boolean(id) });

export const useHomeAssets = (id: string) =>
  useQuery({ queryKey: keys.homeAssets(id), queryFn: () => api<AssetSummary[]>(`/homes/${id}/assets`), enabled: Boolean(id) });

export const useAsset = (id: string) =>
  useQuery({ queryKey: keys.asset(id), queryFn: () => api<AssetDetail>(`/assets/${id}`), enabled: Boolean(id) });

/** Polled so the unread badge in the nav stays fresh while the app is open. */
export const useReminders = () =>
  useQuery({ queryKey: keys.reminders, queryFn: () => api<ReminderList>('/reminders'), refetchInterval: 60_000 });

export const useServiceRequests = () =>
  useQuery({ queryKey: keys.serviceRequests, queryFn: () => api<ServiceRequestSummary[]>('/service-requests'), refetchInterval: 30_000 });

export const useServiceRequest = (id: string) =>
  useQuery({
    queryKey: keys.serviceRequest(id),
    queryFn: () => api<ServiceRequestDetail>(`/service-requests/${id}`),
    enabled: Boolean(id),
    refetchInterval: 30_000,
  });

/** Centers that support the asset; with `requestId`, centers that already rejected that request are left out. */
export const useServiceCenters = (assetId: string, requestId?: string) =>
  useQuery({
    queryKey: keys.serviceCenters(assetId, requestId),
    queryFn: () =>
      api<ServiceCenterOption[]>(`/service-centers?assetId=${assetId}${requestId ? `&requestId=${requestId}` : ''}`),
    enabled: Boolean(assetId),
  });

export interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

export const useTechnicians = () =>
  useQuery({ queryKey: keys.technicians, queryFn: () => api<Technician[]>('/center/technicians') });

export const useCenterProfile = () =>
  useQuery({ queryKey: keys.centerProfile, queryFn: () => api<ServiceCenterProfile>('/center/profile') });

/** The customer's assets in use, across all homes. */
export const useActiveAssets = (enabled = true) =>
  useQuery({ queryKey: keys.activeAssets, queryFn: () => api<AssetSummary[]>('/assets?status=active'), enabled });
