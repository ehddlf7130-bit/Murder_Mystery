import type { Scenario } from '@/types/scenario';
import { locationLabel } from '@/lib/clueRules';
import { objectParticle } from '@/lib/korean';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import type { ClueViewer } from './useClueViewer';

/**
 * 열람 확인 + 단서 본문 모달.
 * 진행 화면의 모든 목록(구역·특수·기록)이 이 한 쌍을 공유한다.
 */
export function ClueViewerDialogs({
  viewer,
  scenario,
}: {
  viewer: ClueViewer;
  scenario: Scenario;
}) {
  const { pendingState, openState, remaining, confirmPending, cancelPending, close } =
    viewer;

  return (
    <>
      <ConfirmDialog
        open={pendingState !== null}
        title="이 단서를 조사할까요?"
        confirmLabel="조사한다"
        cancelLabel="그만둔다"
        onConfirm={confirmPending}
        onCancel={cancelPending}
      >
        {pendingState && (
          <>
            <p>
              <strong className="text-brass-300">{pendingState.clue.name}</strong>
              {objectParticle(pendingState.clue.name).slice(-1)} 조사합니다.
            </p>
            <p className="text-fog-300 text-sm">
              📍 {locationLabel(pendingState.clue.location, scenario)}
            </p>
            <p className="border-ink-700 bg-ink-850 rounded-xl border px-4 py-3 text-sm">
              열람 횟수 <strong>{pendingState.cost}회</strong>가 차감됩니다.
              <br />
              남은 횟수 <strong className="text-fog-100">{remaining}</strong> →{' '}
              <strong className="text-brass-300">
                {remaining - pendingState.cost}
              </strong>
            </p>
          </>
        )}
      </ConfirmDialog>

      <Modal
        open={openState !== null}
        onClose={close}
        size="wide"
        title={openState?.clue.name ?? ''}
        titleAside={
          openState && (
            <div className="flex flex-wrap gap-2">
              <Badge tone="neutral">
                📍 {locationLabel(openState.clue.location, scenario)}
              </Badge>
              {openState.clue.special && (
                <Badge tone="brass">✦ 특수 단서</Badge>
              )}
              {/* 첫 열람 직후에도 맞는 문구여야 하므로 '재열람'이 아니라 '다시 볼 때' */}
              <Badge tone="jade">다시 볼 때 차감 없음</Badge>
            </div>
          )
        }
        footer={
          <Button variant="primary" onClick={close}>
            닫기
          </Button>
        }
      >
        {openState && (
          <div className="space-y-5">
            <p className="text-fog-100 text-lg leading-relaxed whitespace-pre-line">
              {openState.clue.body}
            </p>
            {openState.clue.hint && (
              <p className="border-brass-600/40 bg-brass-500/5 text-brass-300 rounded-xl border px-4 py-3 text-base">
                💡 {openState.clue.hint}
              </p>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
