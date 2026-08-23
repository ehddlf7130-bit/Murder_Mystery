import { useMemo, useState } from 'react';
import { ClueCard } from '@/components/clue/ClueCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { locationLabel } from '@/lib/clueRules';
import { useScenarioProgress } from '@/store/progressStore';
import { cn } from '@/lib/cn';
import { useScenario } from '../scenarioContext';
import { useClueViewerContext } from './boardContext';

const ALL = '전체';

function formatTime(timestamp: number | undefined): string {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** 지금까지 열람한 단서 모아보기 — 클릭하면 차감 없이 다시 열린다 */
export function ViewedLog() {
  const scenario = useScenario();
  const progress = useScenarioProgress(scenario.id);
  const { states, request } = useClueViewerContext();
  const [filter, setFilter] = useState<string>(ALL);

  // 열람 순서를 그대로 보존한다 (최신이 위)
  const entries = useMemo(
    () =>
      [...progress.viewedClueIds]
        .reverse()
        .map((clueId) => {
          const state = states.get(clueId);
          if (!state) return null;
          return {
            state,
            label: locationLabel(state.clue.location, scenario),
            at: progress.viewedAt[clueId],
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null),
    [progress.viewedClueIds, progress.viewedAt, states, scenario],
  );

  const locationFilters = useMemo(
    () => [ALL, ...new Set(entries.map((e) => e.label))],
    [entries],
  );

  const visible = entries.filter((e) => filter === ALL || e.label === filter);

  if (entries.length === 0) {
    return (
      <EmptyState
        icon="📜"
        title="아직 열람한 단서가 없습니다"
        description="맵 조사 탭에서 구역을 선택해 조사를 시작하세요."
      />
    );
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <p className="text-fog-300 mr-2">
          총 <strong className="text-fog-100">{entries.length}</strong>건 열람 ·
          다시 보기는 차감되지 않습니다
        </p>
        {locationFilters.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => setFilter(label)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              filter === label
                ? 'border-brass-500 bg-brass-500/15 text-brass-300'
                : 'border-ink-700 text-fog-400 hover:border-ink-500 hover:text-fog-200',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <ol className="grid gap-3 sm:grid-cols-2">
        {visible.map(({ state, at }) => (
          <li key={state.clue.id} className="relative">
            <ClueCard
              state={state}
              scenario={scenario}
              onClick={() => request(state.clue.id)}
              showLocation
            />
            {at && (
              <span className="text-fog-400 pointer-events-none absolute right-4 bottom-3 text-[11px] tabular-nums">
                {formatTime(at)}
              </span>
            )}
          </li>
        ))}
      </ol>
    </>
  );
}
