import type { Scenario } from '@/types/scenario';
import { locationLabel, type ClueState } from '@/lib/clueRules';
import { objectParticle } from '@/lib/korean';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import type { ClueViewer } from './useClueViewer';

const hintBox =
  'border-brass-600/40 bg-brass-500/5 rounded-xl border px-4 py-3 text-base';

/**
 * 힌트는 열람 예산과 별개인 **힌트 예산**을 따로 소모한다.
 * 본문을 연 뒤에만 살 수 있고, 한 번 사면 이후로는 무료다.
 *
 * 구매 확인은 모달을 새로 띄우지 않고 같은 자리에서 2단계로 처리한다 —
 * 본문 모달 위에 ConfirmDialog를 겹치면 z-index가 DOM 순서에 의존하고
 * Escape 한 번에 두 개가 같이 닫힌다.
 */
function HintSection({
  state,
  viewer,
}: {
  state: ClueState;
  viewer: ClueViewer;
}) {
  const { hint, clue } = state;
  const { hintsRemaining, hintConfirming, requestHint, confirmHint, cancelHint } =
    viewer;

  if (hint.status === 'none') return null;

  if (hint.status === 'revealed') {
    return <p className={`${hintBox} text-brass-300`}>💡 {clue.hint}</p>;
  }

  if (hintConfirming) {
    return (
      <div className={`${hintBox} text-fog-200 space-y-3`}>
        <p>
          힌트 횟수 <strong className="text-brass-300">{hint.cost}회</strong>가
          차감됩니다.
          <br />
          남은 힌트 <strong className="text-fog-100">{hintsRemaining}</strong> →{' '}
          <strong className="text-brass-300">{hintsRemaining - hint.cost}</strong>
        </p>
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={cancelHint}>
            그만둔다
          </Button>
          <Button size="sm" variant="primary" onClick={confirmHint} autoFocus>
            힌트를 본다
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${hintBox} flex flex-wrap items-center justify-between gap-3`}>
      <p className="text-fog-300 text-sm">
        💡 이 단서에는 힌트가 있습니다
        {hint.status === 'insufficient' && (
          <span className="text-crimson-400"> · 남은 힌트가 부족합니다</span>
        )}
      </p>
      <Button
        size="sm"
        variant="secondary"
        onClick={requestHint}
        disabled={hint.status !== 'available'}
      >
        {hint.cost === 0 ? '힌트 보기 · 무료' : `힌트 보기 · ${hint.cost}회 소모`}
      </Button>
    </div>
  );
}

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
            <HintSection state={openState} viewer={viewer} />
          </div>
        )}
      </Modal>
    </>
  );
}
