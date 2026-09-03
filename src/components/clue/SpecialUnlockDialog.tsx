import type { Clue, ClueId, Scenario } from '@/types/scenario';
import type { ClueState } from '@/lib/clueRules';
import { withParticle } from '@/lib/korean';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ClueCard } from './ClueCard';

/**
 * 특수 단서 해제 알림.
 *
 * 해제는 선행 단서 본문을 읽는 도중에 조용히 일어나므로, 알려 주지 않으면
 * 모달을 닫고 다음 구역으로 넘어가면서 통째로 놓친다. 공용 노트북 한 대를
 * 여럿이 함께 보는 형태라 "모두가 동시에 알아채는" 순간이 필요해 모달로 띄운다.
 *
 * 해제된 단서는 실명을 드러내도 된다 — 가려야 하는 건 잠긴 동안의 이름뿐이다.
 */
export function SpecialUnlockDialog({
  clues,
  states,
  scenario,
  onOpen,
  onDismiss,
}: {
  /** 이번에 새로 해제된 특수 단서들 (비어 있으면 렌더하지 않는다) */
  clues: Clue[];
  states: Map<ClueId, ClueState>;
  scenario: Scenario;
  onOpen: (clueId: ClueId) => void;
  onDismiss: () => void;
}) {
  const single = clues.length === 1 ? clues[0] : null;

  return (
    <Modal
      open={clues.length > 0}
      onClose={onDismiss}
      title={
        clues.length > 1
          ? `✦ 특수 단서 ${clues.length}개 해제`
          : '✦ 특수 단서 해제'
      }
      titleAside={<Badge tone="brass">모아 온 단서가 맞물렸습니다</Badge>}
      footer={
        <>
          <Button variant="ghost" onClick={onDismiss}>
            나중에
          </Button>
          {single && (
            <Button variant="primary" onClick={() => onOpen(single.id)} autoFocus>
              지금 열람한다
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-fog-300">
          {single ? (
            <>
              <strong className="text-brass-300">{single.name}</strong>
              {withParticle(single.name, '이', '가').slice(-1)} 잠금에서 풀렸습니다.
            </>
          ) : (
            '아래 특수 단서들이 잠금에서 풀렸습니다.'
          )}
        </p>

        <div className="grid gap-3">
          {clues.map((clue) => {
            const state = states.get(clue.id);
            if (!state) return null;
            return (
              <ClueCard
                key={clue.id}
                state={state}
                scenario={scenario}
                onClick={() => onOpen(clue.id)}
                showLocation
              />
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
