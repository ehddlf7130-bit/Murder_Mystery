import type { Scenario } from '@/types/scenario';
import { locationLabel, type ClueState, type ClueStatus } from '@/lib/clueRules';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import { RequirementList } from './RequirementList';

const frames: Record<ClueStatus, string> = {
  viewed: 'border-jade-500/40 bg-jade-500/5 hover:border-jade-400/60',
  available: 'border-brass-600/50 bg-ink-850 hover:border-brass-400 hover:bg-ink-800',
  insufficient: 'border-ink-700 bg-ink-900/60',
  locked: 'border-ink-800 bg-ink-950/60',
};

function StatusBadge({ state }: { state: ClueState }) {
  switch (state.status) {
    case 'viewed':
      return <Badge tone="jade">✓ 확인함</Badge>;
    case 'available':
      return state.cost === 0 ? (
        <Badge tone="brass">해제됨 · 무료</Badge>
      ) : (
        <Badge tone="brass">{state.cost}회 차감</Badge>
      );
    case 'insufficient':
      return <Badge tone="crimson">열람 횟수 부족</Badge>;
    case 'locked':
      return <Badge tone="muted">🔒 잠김</Badge>;
  }
}

export function ClueCard({
  state,
  scenario,
  onClick,
  showLocation = false,
}: {
  state: ClueState;
  scenario: Scenario;
  onClick: () => void;
  /** 특수 단서 탭·열람 기록처럼 여러 구역이 섞이는 목록에서 true */
  showLocation?: boolean;
}) {
  const { clue, status } = state;
  const locked = status === 'locked';
  const interactive = status === 'viewed' || status === 'available';

  // 잠긴 단서는 실명을 감춘다 — 이름 자체가 스포일러인 경우가 많다.
  const displayName = locked
    ? (clue.special?.lockedLabel ?? '??? — 미확인 단서')
    : clue.name;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      aria-label={displayName}
      className={cn(
        'flex w-full flex-col gap-2 rounded-2xl border p-4 text-left transition-all',
        frames[status],
        interactive ? 'cursor-pointer' : 'cursor-default',
        !interactive && 'opacity-70',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            'leading-snug font-semibold',
            locked ? 'text-fog-400' : 'text-fog-100',
          )}
        >
          {displayName}
        </span>
        <StatusBadge state={state} />
      </div>

      {showLocation && (
        <span className="text-fog-400 text-xs">
          📍 {locationLabel(clue.location, scenario)}
        </span>
      )}

      {locked && <RequirementList state={state} scenario={scenario} />}

      {status === 'viewed' && clue.hint && (
        <p className="text-fog-400 line-clamp-2 text-sm">💡 {clue.hint}</p>
      )}

      {state.gmUnlocked && status !== 'locked' && (
        <span className="text-brass-600 text-xs">심판이 해제한 단서</span>
      )}
    </button>
  );
}
