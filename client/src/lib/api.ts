import type { ApiErrorBody } from '@ham/shared';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors: Record<string, string> = {},
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const body = init?.body;
  const isForm = body instanceof FormData;
  const res = await fetch(`/api${path}`, {
    method: init?.method ?? 'GET',
    headers: body !== undefined && !isForm ? { 'content-type': 'application/json' } : undefined,
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    credentials: 'same-origin',
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data as Partial<ApiErrorBody>;
    throw new ApiError(res.status, err.error ?? 'Something went wrong.', err.fieldErrors);
  }
  return data as T;
}

/** Field errors from a failed request, or none. */
export function fieldErrorsOf(error: unknown): Record<string, string> {
  return error instanceof ApiError ? error.fieldErrors : {};
}
