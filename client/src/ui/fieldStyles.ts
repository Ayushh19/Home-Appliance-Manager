/** Shared look for text inputs, selects and textareas (label above, 1px stroke, inset). */
export function fieldClass(error?: string) {
  return (
    'w-full rounded-sm border bg-field px-4 py-3 text-base shadow-neu-inset outline-none ' +
    'transition-colors duration-200 placeholder:text-muted/70 ' +
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong ' +
    (error ? 'border-danger' : 'border-line')
  );
}
