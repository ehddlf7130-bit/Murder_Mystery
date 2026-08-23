import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'brass' | 'jade' | 'crimson' | 'muted';

const tones: Record<Tone, string> = {
  neutral: 'bg-ink-700 text-fog-200 border-ink-600',
  brass: 'bg-brass-500/15 text-brass-300 border-brass-600/50',
  jade: 'bg-jade-500/15 text-jade-400 border-jade-500/40',
  crimson: 'bg-crimson-500/15 text-crimson-400 border-crimson-500/40',
  muted: 'bg-ink-850 text-fog-400 border-ink-700',
};

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5',
        'text-xs font-medium tracking-tight whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
