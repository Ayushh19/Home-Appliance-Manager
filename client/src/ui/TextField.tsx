import { useId, type InputHTMLAttributes } from 'react';
import { describedBy, FieldShell } from './FieldShell';
import { fieldClass } from './fieldStyles';

export function TextField({
  label,
  error,
  hint,
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} className={className}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={fieldClass(error)}
        {...props}
      />
    </FieldShell>
  );
}
