import type { SessionUser, UserRole } from '@ham/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../lib/api';

export const ME_KEY = ['auth', 'me'] as const;

export function useMe() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        return await api<SessionUser>('/auth/me');
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return null;
        throw err;
      }
    },
    staleTime: Infinity,
    retry: false,
  });
}

/** Wraps an auth call (login/register) so the signed-in user is cached on success. */
export function useAuthMutation<I>(path: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: I) => api<SessionUser>(path, { method: 'POST', body: input }),
    onSuccess: (user) => queryClient.setQueryData(ME_KEY, user),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api<void>('/auth/logout', { method: 'POST' }),
    onSuccess: () => {
      queryClient.clear();
      queryClient.setQueryData(ME_KEY, null);
    },
  });
}

export const HOME_PATH: Record<UserRole, string> = {
  customer: '/app',
  center_staff: '/center',
  technician: '/technician',
};
