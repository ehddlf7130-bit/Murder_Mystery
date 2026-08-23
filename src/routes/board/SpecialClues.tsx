import { ClueCard } from '@/components/clue/ClueCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionTitle } from '@/components/ui/Panel';
import { Badge } from '@/components/ui/Badge';
import { useScenario } from '../scenarioContext';
import { useClueViewerContext } from './boardContext';

/**
 * 특수 단서 탭.
 *
 * 잠긴 단서도 **반드시 보여준다** — 플레이어가 "무엇을 목표로 모아야 하는지"를
 * 인지하는 화면이기 때문이다. 실명 대신 lockedLabel과 위치 기반 해제 조건만 노출해
 * 정답은 흘리지 않는다. (구역 목록의 hiddenUntilUnlocked와 달리 여기서는 숨기지 않는다)
 */
export function SpecialClues() {
  const scenario = useScenario();
  const { states, request } = useClueViewerContext();

  const sections = scenario.specialCategories
    .map((category) => ({
      category,
      clues: scenario.clues.filter((c) => c.special?.category === category.key),
    }))
    .filter((section) => section.clues.length > 0);

  const unlockedCount = scenario.clues.filter(
    (c) => c.special && states.get(c.id)?.status !== 'locked',
  ).length;
  const specialTotal = scenario.clues.filter((c) => c.special).length;

  if (sections.length === 0) {
    return (
      <EmptyState
        icon="✦"
        title="이 시나리오에는 특수 단서가 없습니다"
      />
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-fog-300">
          하위 단서를 모두 확보하면 해제되는 결정적 단서입니다.{' '}
          <strong className="text-brass-300">해제된 특수 단서는 무료로 열람</strong>
          할 수 있습니다.
        </p>
        <Badge tone="brass">
          해제 {unlockedCount}/{specialTotal}
        </Badge>
      </div>

      <div className="space-y-8">
        {sections.map(({ category, clues }) => (
          <section key={category.key}>
            <SectionTitle>
              {category.emoji && <span aria-hidden>{category.emoji} </span>}
              {category.label}
            </SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2">
              {clues.map((clue) => {
                const state = states.get(clue.id);
                if (!state) return null;
                return (
                  <ClueCard
                    key={clue.id}
                    state={state}
                    scenario={scenario}
                    onClick={() => request(clue.id)}
                    showLocation={state.status !== 'locked'}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
