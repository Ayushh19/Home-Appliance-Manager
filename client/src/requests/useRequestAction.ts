import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { keys } from '../lib/queries';

/** POSTs to /service-requests/:id/<path> and refreshes everything a status change can affect. */
export function useRequestAction<B = unknown>(requestId: string, path: string, onDone?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body?: B) => api(`/service-requests/${requestId}/${path}`, { method: 'POST', body: body ?? {} }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.serviceRequests });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: keys.reminders });
      onDone?.();
    },
    // A 409 means someone else changed the request; reload it so the page shows the truth.
    onError: () => queryClient.invalidateQueries({ queryKey: keys.serviceRequest(requestId) }),
  });
}
