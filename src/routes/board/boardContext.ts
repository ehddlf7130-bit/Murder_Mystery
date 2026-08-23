import { createContext, use } from 'react';
import type { ClueViewer } from '@/components/clue/useClueViewer';

export const ClueViewerContext = createContext<ClueViewer | null>(null);

/**
 * 진행 화면의 단서 뷰어.
 * BoardLayout이 한 번만 만들어 모든 탭이 공유하므로, 탭을 옮겨도
 * 열려 있던 단서 상태와 확인 다이얼로그가 일관되게 동작한다.
 */
export function useClueViewerContext(): ClueViewer {
  const viewer = use(ClueViewerContext);
  if (!viewer) {
    throw new Error('useClueViewerContext는 BoardLayout 안에서만 사용할 수 있습니다.');
  }
  return viewer;
}
