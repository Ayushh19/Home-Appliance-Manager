import { useLocation } from 'react-router';

/** Where the customer started a service request from, so the form can send them back there (docs/DECISIONS.md #38). */
export interface RequestOrigin {
  to: string;
  label: string;
}

/** Shown once on the starting page after a request is sent. */
export interface RequestSent {
  requestId: string;
  assetLabel: string;
}

export function useRequestOrigin(): RequestOrigin | undefined {
  return (useLocation().state as { from?: RequestOrigin } | null)?.from;
}
