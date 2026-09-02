import { Link, Navigate, useParams } from 'react-router-dom';
import { ClueCard } from '@/components/clue/ClueCard';
import { deckLabel, deckOf } from '@/lib/decks';
import { EmptyState } from '@/components/ui/EmptyState';
import { Panel } from '@/components/ui/Panel';
import { useScenario } from '../scenarioContext';
import { useClueViewerContext } from './boardContext';

/** 한 구역에 배치된 단서 목록 */
export function AreaDetail() {
  const { areaId } = useParams();
  const scenario = useScenario();
  const { states, request } = useClueViewerContext();

  const area = scenario.areas.find((a) => a.id === areaId);
  if (!area) return <Navigate to=".." relative="path" replace />;

  const deck = deckOf(area, scenario);

  const clues = scenario.clues.filter((clue) => {
    if (clue.location.kind !== 'area' || clue.location.areaId !== area.id) {
      return false;
    }
    // hiddenUntilUnlocked 단서는 해제될 때까지 이 목록에 나타나지 않는다.
    // (특수 단서 탭에서는 잠김 상태로 보여 목표는 인지할 수 있다)
    return states.get(clue.id)?.visible ?? false;
  });

  return (
    <>
      <Link
        to=".."
        relative="path"
        className="text-fog-400 hover:text-brass-300 mb-3 inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        ← 맵으로
      </Link>

      {deck && (
        <p className="text-brass-500 text-xs font-semibold tracking-widest uppercase">
          {deckLabel(deck)}
        </p>
      )}
      <h2 className="text-fog-100 mt-1 mb-3 flex items-center gap-3 text-2xl font-bold">
        <span aria-hidden>{area.emoji ?? '📍'}</span>
        {area.name}
      </h2>

      <Panel className="mb-6">
        <p className="text-fog-200 leading-relaxed">{area.description}</p>
      </Panel>

      {clues.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="이 구역에서 조사할 것이 보이지 않습니다"
          description="다른 구역을 살펴보거나, 특수 단서 탭에서 해제 조건을 확인해 보세요."
        />
      ) : (
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
              />
            );
          })}
        </div>
      )}
    </>
  );
}
