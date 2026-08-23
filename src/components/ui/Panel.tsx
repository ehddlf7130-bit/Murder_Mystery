import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** 기본 표면(surface). 카드·섹션 컨테이너로 쓴다 */
export function Panel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'border-ink-700 bg-ink-900/80 rounded-2xl border p-5 shadow-lg shadow-black/20',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  children,
  aside,
}: {
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-brass-300 text-sm font-semibold tracking-widest uppercase">
        {children}
      </h2>
      {aside}
    </div>
  );
}
