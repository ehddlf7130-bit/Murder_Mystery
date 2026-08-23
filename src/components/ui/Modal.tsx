import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** 제목 옆 배지 등 */
  titleAside?: ReactNode;
  /** 하단 액션 영역 */
  footer?: ReactNode;
  /** 공용 노트북에서 단서 본문을 넓게 보여주려면 'wide' */
  size?: 'md' | 'wide';
  children: ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  titleAside,
  footer,
  size = 'md',
  children,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    // 배경 스크롤 잠금
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // 열릴 때 패널로 포커스를 옮겨 Esc와 스크린리더가 바로 동작하게 한다
    panelRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={cn(
          'border-ink-600 bg-ink-900 relative flex max-h-[90dvh] w-full flex-col',
          'rounded-t-3xl border shadow-2xl shadow-black/50 outline-none sm:rounded-3xl',
          size === 'wide' ? 'sm:max-w-3xl' : 'sm:max-w-lg',
        )}
      >
        <header className="border-ink-700 flex items-start justify-between gap-4 border-b px-6 py-4">
          <div className="min-w-0">
            <h2 className="text-fog-100 text-xl leading-snug font-semibold">
              {title}
            </h2>
            {titleAside && <div className="mt-2">{titleAside}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-fog-400 hover:bg-ink-800 hover:text-fog-100 -mt-1 rounded-lg p-2 text-2xl leading-none transition-colors"
          >
            ×
          </button>
        </header>

        <div className="overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <footer className="border-ink-700 pb-safe flex justify-end gap-3 border-t px-6 pt-4 sm:pb-4">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
