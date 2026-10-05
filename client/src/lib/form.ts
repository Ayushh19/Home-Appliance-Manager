import type { z } from 'zod';

/** Validates on the client with the same shared schema the server uses. */
export function validate<S extends z.ZodType>(
  schema: S,
  value: unknown,
): { data: z.output<S>; errors: null } | { data: null; errors: Record<string, string> } {
  const result = schema.safeParse(value);
  if (result.success) return { data: result.data, errors: null };
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) errors[issue.path.join('.')] ??= issue.message;
  return { data: null, errors };
}
