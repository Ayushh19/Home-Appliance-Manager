import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'ghost';

const base =
  'inline-flex items-center justify-center gap-2 rounded-sm px-5 py-3 text-sm font-semibold ' +
  'transition-[background-color,box-shadow,transform] duration-200 ease-out active:translate-y-px active:duration-150 ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-ink shadow-neu-sm hover:bg-accent-hover hover:shadow-neu active:shadow-neu-inset',
  ghost: 'border-[1.5px] border-line text-ink hover:bg-surface-raised',
};

/** Button styles, also used for links that look like buttons. */
export function buttonClass(variant: Variant = 'primary', className = '') {
  return `${base} ${variants[variant]} ${className}`;
}

export function Button({
  variant = 'primary',
  loading = false,
  className = '',
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  return (
    <button
      className={buttonClass(variant, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {children}
    </button>
  );
}
