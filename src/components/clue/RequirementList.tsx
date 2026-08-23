import type { Scenario } from '@/types/scenario';
import { describeUnmetRequires, type ClueState } from '@/lib/clueRules';
import { Badge } from '@/components/ui/Badge';

/**
 * 잠긴 단서의 해제 조건 표시.
 *
 * 선행 단서의 **이름은 절대 노출하지 않는다** — 위치와 개수만 알려 준다.
 * 목표는 인지시키되 정답을 흘리지 않기 위한 타협점.
 */
export function RequirementList({
  state,
  scenario,
}: {
  state: ClueState;
  scenario: Scenario;
}) {
  const summaries = describeUnmetRequires(state.unmetRequires, scenario);

  return (
    <div className="space-y-2">
      {state.clue.special?.lockedTeaser && (
        <p className="text-fog-300 text-sm italic">
          {state.clue.special.lockedTeaser}
        </p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {summaries.map((text) => (
          <Badge key={text} tone="muted">
            🔒 {text}
          </Badge>
        ))}
      </div>
    </div>
  );
}
