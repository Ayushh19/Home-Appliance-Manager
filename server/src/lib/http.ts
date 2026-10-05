import type { ApiErrorBody } from '@ham/shared';
import type { ErrorRequestHandler } from 'express';
import type { z } from 'zod';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message);
  }
}

/** Parses a request body with a shared zod schema, or throws a 400 with per-field messages. */
export function parseBody<S extends z.ZodType>(schema: S, body: unknown): z.output<S> {
  const result = schema.safeParse(body);
  if (result.success) return result.data;
  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.');
    // A field missing from the body gets the same message the form shows for an empty one.
    const missing = issue.code === 'invalid_type' && /received undefined/.test(issue.message);
    fieldErrors[key] ??= missing ? 'Required' : issue.message;
  }
  throw new HttpError(400, 'Please fix the highlighted fields.', fieldErrors);
}

/** Postgres unique-violation error code. */
export function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === '23505' || e?.cause?.code === '23505';
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    const body: ApiErrorBody = { error: err.message, fieldErrors: err.fieldErrors };
    res.status(err.status).json(body);
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong.' } satisfies ApiErrorBody);
};
