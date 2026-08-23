import { Link, NavLink, Outlet } from 'react-router-dom';
import { useClueViewer } from '@/components/clue/useClueViewer';
import { ClueViewerDialogs } from '@/components/clue/ClueViewerDialogs';
import { totalInvestigations } from '@/lib/clueRules';
import { useScenarioProgress } from '@/store/progressStore';
import { cn } from '@/lib/cn';
import { useScenario } from '../scenarioContext';
import { ClueViewerContext } from './boardContext';

const tabs = [
  { to: 'map', label: '맵 조사', icon: '🗺️' },
  { to: 'special', label: '특수 단서', icon: '✦' },
  { to: 'log', label: '열람 기록', icon: '📜' },
];

/** 남은 열람 횟수 — 화면에서 가장 눈에 띄어야 하는 정보 */
function InvestigationCounter() {
  const scenario = useScenario();
  const progress = useScenarioProgress(scenario.id);
  const total = totalInvestigations(scenario, progress);
  const remaining = Math.max(0, total - progress.spent);
  const ratio = total === 0 ? 0 : remaining / total;

  const tone =
    remaining === 0
      ? 'text-crimson-400'
      : ratio <= 0.25
        ? 'text-crimson-400'
        : ratio <= 0.5
          ? 'text-brass-300'
          : 'text-jade-400';

  return (
    <div className="flex items-center gap-4">
      <div className="text-right">
        <p className="text-fog-400 text-[11px] font-semibold tracking-widest uppercase">
          남은 열람 횟수
        </p>
        <p className="flex items-baseline justify-end gap-1 leading-none">
          <span className={cn('text-4xl font-bold tabular-nums', tone)}>
            {remaining}
          </span>
          <span className="text-fog-400 text-lg">/ {total}</span>
        </p>
      </div>
      <div
        className="bg-ink-800 h-14 w-2.5 overflow-hidden rounded-full"
        role="presentation"
      >
        <div
          className={cn(
            'w-full rounded-full transition-all duration-500',
            remaining === 0 || ratio <= 0.25
              ? 'bg-crimson-500'
              : ratio <= 0.5
                ? 'bg-brass-500'
                : 'bg-jade-500',
          )}
          style={{ height: `${ratio * 100}%`, marginTop: `${(1 - ratio) * 100}%` }}
        />
      </div>
    </div>
  );
}

/** 3-B단계: 공용 노트북 진행 화면 셸 */
export function BoardLayout() {
  const scenario = useScenario();
  const viewer = useClueViewer(scenario);

  return (
    <div className="min-h-dvh">
      <header className="border-ink-700 bg-ink-950/95 sticky top-0 z-30 border-b backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 pt-4 sm:px-6">
          <div className="min-w-0">
            {/* 현재 위치가 /board/map/:areaId일 수도 있으므로 상대 경로 대신 절대 경로 */}
            <Link
              to={`/s/${scenario.id}`}
              className="text-fog-400 hover:text-brass-300 text-xs transition-colors"
            >
              ← 모드 선택
            </Link>
            <h1 className="text-fog-100 truncate text-lg font-bold sm:text-xl">
              {scenario.title}
            </h1>
          </div>
          <InvestigationCounter />
        </div>

        <nav className="mx-auto flex max-w-6xl gap-1 px-4 sm:px-6" aria-label="진행 화면 탭">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                cn(
                  '-mb-px flex items-center gap-2 rounded-t-lg border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-brass-400 text-brass-300'
                    : 'text-fog-400 hover:text-fog-200 border-transparent',
                )
              }
            >
              <span aria-hidden>{tab.icon}</span>
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <ClueViewerContext.Provider value={viewer}>
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <Outlet />
        </div>
      </ClueViewerContext.Provider>

      <ClueViewerDialogs viewer={viewer} scenario={scenario} />
    </div>
  );
}
