import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

/**
 * 공통 화면 껍데기.
 * `width`는 대상 기기에 맞춘다 — 'narrow'는 개인 모바일, 'wide'는 공용 노트북.
 */
export function Screen({
  back,
  backLabel = '뒤로',
  eyebrow,
  title,
  subtitle,
  action,
  width = 'wide',
  children,
}: {
  back?: string;
  backLabel?: string;
  eyebrow?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  width?: 'narrow' | 'wide';
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'mx-auto px-4 pt-5 pb-12 sm:px-6',
        width === 'narrow' ? 'max-w-xl' : 'max-w-6xl',
      )}
    >
      {(back || title || action) && (
        <header className="mb-6">
          {back && (
            <Link
              to={back}
              className="text-fog-400 hover:text-brass-300 mb-3 inline-flex items-center gap-1.5 text-sm transition-colors"
            >
              ← {backLabel}
            </Link>
          )}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              {eyebrow && (
                <p className="text-brass-500 mb-1 text-xs font-semibold tracking-widest uppercase">
                  {eyebrow}
                </p>
              )}
              {title && (
                <h1 className="text-fog-100 text-2xl leading-tight font-bold sm:text-3xl">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-fog-300 mt-2 max-w-3xl text-base">{subtitle}</p>
              )}
            </div>
            {action}
          </div>
        </header>
      )}
      {children}
    </div>
  );
}
