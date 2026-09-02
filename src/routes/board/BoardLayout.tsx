import { Link, NavLink, Outlet } from 'react-router-dom';
import { useClueViewer } from '@/components/clue/useClueViewer';
import { ClueViewerDialogs } from '@/components/clue/ClueViewerDialogs';
import {
  remainingHints,
  remainingInvestigations,
  totalHints,
  totalInvestigations,
} from '@/lib/clueRules';
import { useScenarioProgress } from '@/store/progressStore';
import { cn } from '@/lib/cn';
import { useScenario } from '../scenarioContext';
import { ClueViewerContext } from './boardContext';

const tabs = [
  { to: 'map', label: '맵 조사', icon: '🗺️' },
  { to: 'special', label: '특수 단서', icon: '✦' },
  { to: 'log', label: '열람 기록', icon: '📜' },
];

/** 잔여량이 줄수록 붉어진다 */
function toneFor(ratio: number, empty: boolean) {
  if (empty || ratio <= 0.25) return { text: 'text-crimson-400', bar: 'bg-crimson-500' };
  if (ratio <= 0.5) return { text: 'text-brass-300', bar: 'bg-brass-500' };
  return { text: 'text-jade-400', bar: 'bg-jade-500' };
}

/**
 * 남은 예산 표시. 열람 횟수와 힌트 횟수는 **서로 다른 예산**이라 따로 센다.
 * 힌트는 보조 자원이므로 막대 없이 작게 — 헤더가 모바일에서 이미 빡빡하다.
 */
function ResourceCounter({
  label,
  remaining,
  total,
  compact = false,
}: {
  label: string;
  remaining: number;
  total: number;
  compact?: boolean;
}) {
  const ratio = total === 0 ? 0 : remaining / total;
  const tone = toneFor(ratio, remaining === 0);

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="text-fog-400 text-[11px] font-semibold tracking-widest uppercase">
          {label}
        </p>
        <p className="flex items-baseline justify-end gap-1 leading-none">
          <span
            className={cn(
              'font-bold tabular-nums',
              compact ? 'text-2xl' : 'text-4xl',
              tone.text,
            )}
          >
            {remaining}
          </span>
          <span className={cn('text-fog-400', compact ? 'text-sm' : 'text-lg')}>
            / {total}
          </span>
        </p>
      </div>
      {!compact && (
        <div
          className="bg-ink-800 h-14 w-2.5 overflow-hidden rounded-full"
          role="presentation"
        >
          <div
            className={cn('w-full rounded-full transition-all duration-500', tone.bar)}
            style={{ height: `${ratio * 100}%`, marginTop: `${(1 - ratio) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}

/** 남은 열람 횟수 + 남은 힌트 — 화면에서 가장 눈에 띄어야 하는 정보 */
function BudgetCounters() {
  const scenario = useScenario();
  const progress = useScenarioProgress(scenario.id);

  return (
    <div className="flex shrink-0 items-center gap-4 sm:gap-6">
      {totalHints(scenario, progress) > 0 && (
        <ResourceCounter
          label="남은 힌트"
          remaining={remainingHints(scenario, progress)}
          total={totalHints(scenario, progress)}
          compact
        />
      )}
      <ResourceCounter
        label="남은 열람 횟수"
        remaining={remainingInvestigations(scenario, progress)}
        total={totalInvestigations(scenario, progress)}
      />
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
          <BudgetCounters />
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
