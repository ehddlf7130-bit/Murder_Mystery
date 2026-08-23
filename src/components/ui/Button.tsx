import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary:
    'bg-brass-500 text-ink-950 font-semibold hover:bg-brass-400 active:bg-brass-600',
  secondary:
    'bg-ink-800 text-fog-100 border border-ink-600 hover:bg-ink-700 hover:border-ink-500',
  ghost: 'text-fog-300 hover:text-fog-100 hover:bg-ink-800',
  danger:
    'bg-crimson-500 text-white font-semibold hover:bg-crimson-400 active:bg-crimson-500',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2.5 rounded-xl',
  lg: 'px-6 py-4 text-lg rounded-2xl',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-inherit',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
