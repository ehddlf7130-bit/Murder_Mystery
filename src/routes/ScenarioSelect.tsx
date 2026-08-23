import { Link } from 'react-router-dom';
import { listScenarios } from '@/data';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';

/** 1단계: 플레이할 시나리오 선택 */
export function ScenarioSelect() {
  const scenarios = listScenarios();

  return (
    <Screen
      eyebrow="Murder Mystery"
      title="어떤 사건을 파헤칠까요?"
      subtitle="플레이할 시나리오를 선택하세요."
    >
      {scenarios.length === 0 ? (
        <EmptyState
          title="등록된 시나리오가 없습니다"
          description="src/data/ 아래에 시나리오를 추가하고 레지스트리에 등록하세요."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {scenarios.map((scenario) => (
            <Link
              key={scenario.id}
              to={`/s/${scenario.id}`}
              className="border-ink-700 bg-ink-900/80 hover:border-brass-500/70 hover:bg-ink-850 group flex flex-col gap-3 rounded-2xl border p-6 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-fog-100 group-hover:text-brass-300 text-xl font-bold transition-colors">
                  {scenario.title}
                </h2>
                <span aria-hidden className="text-2xl opacity-60">
                  🚢
                </span>
              </div>
              <p className="text-fog-300 text-sm">{scenario.tagline}</p>
              <div className="mt-auto flex flex-wrap gap-2 pt-2">
                <Badge tone="neutral">👥 {scenario.playerCount}</Badge>
                <Badge tone="neutral">⏱️ {scenario.playtime}</Badge>
                <Badge tone="brass">
                  🔍 열람 {scenario.totalInvestigations}회
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Screen>
  );
}
