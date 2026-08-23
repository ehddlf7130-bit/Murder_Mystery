import type { ReactNode } from 'react';

export function EmptyState({
  icon = '🕯️',
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="border-ink-700 flex flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-14 text-center">
      <span aria-hidden className="text-4xl opacity-70">
        {icon}
      </span>
      <p className="text-fog-200 font-medium">{title}</p>
      {description && (
        <p className="text-fog-400 max-w-md text-sm">{description}</p>
      )}
      {action}
    </div>
  );
}
