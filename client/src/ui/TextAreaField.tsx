import { useId, type TextareaHTMLAttributes } from 'react';
import { describedBy, FieldShell } from './FieldShell';
import { fieldClass } from './fieldStyles';

export function TextAreaField({
  label,
  error,
  hint,
  className = '',
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string; hint?: string }) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} className={className}>
      <textarea
        id={id}
        rows={3}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={`${fieldClass(error)} resize-y`}
        {...props}
      />
    </FieldShell>
  );
}
