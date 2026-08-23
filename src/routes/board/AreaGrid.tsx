import { Link } from 'react-router-dom';
import { areaProgress } from '@/lib/clueRules';
import { Badge } from '@/components/ui/Badge';
import { useScenario } from '../scenarioContext';
import { useClueViewerContext } from './boardContext';

/** 맵 구역 목록 */
export function AreaGrid() {
  const scenario = useScenario();
  const { states } = useClueViewerContext();
  const areas = [...scenario.areas].sort((a, b) => a.order - b.order);

  return (
    <>
      <p className="text-fog-300 mb-5">
        조사할 구역을 선택하세요. 구역 안의 단서를 처음 열람할 때 횟수가 차감됩니다.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {areas.map((area) => {
          const { viewed, total } = areaProgress(area.id, scenario, states);
          const complete = total > 0 && viewed === total;

          return (
            <Link
              key={area.id}
              to={area.id}
              className="border-ink-700 bg-ink-900/80 hover:border-brass-500/70 hover:bg-ink-850 group flex flex-col gap-3 rounded-2xl border p-6 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <span aria-hidden className="text-3xl">
                  {area.emoji ?? '📍'}
                </span>
                <Badge tone={complete ? 'jade' : viewed > 0 ? 'brass' : 'muted'}>
                  {complete ? '✓ 조사 완료' : `열람 ${viewed}/${total}`}
                </Badge>
              </div>
              <h2 className="text-fog-100 group-hover:text-brass-300 text-lg font-bold transition-colors">
                {area.name}
              </h2>
              <p className="text-fog-400 line-clamp-2 text-sm">{area.description}</p>
            </Link>
          );
        })}
      </div>
    </>
  );
}
