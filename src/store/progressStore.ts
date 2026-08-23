import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ClueId, Scenario, ScenarioId } from '@/types/scenario';
import {
  buildClueStates,
  canView,
  chargeFor,
  type ProgressSnapshot,
} from '@/lib/clueRules';

/**
 * 공용 노트북의 진행 상태. 시나리오별로 격리되어 저장된다.
 *
 * ⚠️ 이 상태는 진행 화면을 연 **그 브라우저에만** 존재한다.
 * 여러 기기에서 진행 화면을 열면 열람 횟수가 각각 따로 세어진다 —
 * 진행 화면은 공용 노트북 1대에서만 열어야 한다.
 */

export interface ScenarioProgress extends ProgressSnapshot {
  viewedClueIds: ClueId[];
  /** 단서별 최초 열람 시각 (열람 기록 화면에 표시) */
  viewedAt: Record<ClueId, number>;
  spent: number;
  startedAt: number | null;
  gmUnlockedClueIds: ClueId[];
  bonusInvestigations: number;
}

/**
 * 없는 시나리오를 조회할 때 돌려줄 기본값.
 * 매 렌더마다 새 객체를 만들면 셀렉터가 무한 리렌더를 유발하므로
 * 모듈 레벨 상수 하나를 공유한다.
 */
export const emptyScenarioProgress: ScenarioProgress = {
  viewedClueIds: [],
  viewedAt: {},
  spent: 0,
  startedAt: null,
  gmUnlockedClueIds: [],
  bonusInvestigations: 0,
};

interface ProgressState {
  byScenario: Record<ScenarioId, ScenarioProgress>;

  /**
   * 단서를 열람 처리한다. 규칙(잠금/잔여 횟수)을 다시 검사하므로
   * UI 버그로 잘못된 호출이 와도 상태가 오염되지 않는다.
   * @returns 실제로 열람 처리되었는지
   */
  viewClue: (scenario: Scenario, clueId: ClueId) => boolean;

  /** 심판: 이 시나리오의 진행을 초기값으로 되돌린다 */
  resetScenario: (scenarioId: ScenarioId) => void;
  /** 심판: 총 열람 횟수를 가감한다 */
  adjustInvestigations: (scenarioId: ScenarioId, delta: number) => void;
  /** 심판: 선행조건을 무시하고 단서를 해제한다 */
  setForceUnlocked: (
    scenarioId: ScenarioId,
    clueId: ClueId,
    unlocked: boolean,
  ) => void;
  /** 심판: 열람 처리 자체를 직접 켜고 끈다 (횟수 차감 여부 선택) */
  setViewed: (
    scenarioId: ScenarioId,
    clueId: ClueId,
    viewed: boolean,
    options?: { charge?: number },
  ) => void;
}

function ensure(
  byScenario: Record<ScenarioId, ScenarioProgress>,
  scenarioId: ScenarioId,
): ScenarioProgress {
  return byScenario[scenarioId] ?? emptyScenarioProgress;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      byScenario: {},

      viewClue: (scenario, clueId) => {
        const current = ensure(get().byScenario, scenario.id);
        const state = buildClueStates(scenario, current).get(clueId);
        if (!state || !canView(state)) return false;

        // 재열람은 차감 없음 — chargeFor가 0을 돌려준다.
        const charge = chargeFor(state);
        if (state.status === 'viewed') return true;

        const now = Date.now();
        set({
          byScenario: {
            ...get().byScenario,
            [scenario.id]: {
              ...current,
              viewedClueIds: [...current.viewedClueIds, clueId],
              viewedAt: { ...current.viewedAt, [clueId]: now },
              spent: current.spent + charge,
              startedAt: current.startedAt ?? now,
            },
          },
        });
        return true;
      },

      resetScenario: (scenarioId) => {
        const next = { ...get().byScenario };
        delete next[scenarioId];
        set({ byScenario: next });
      },

      adjustInvestigations: (scenarioId, delta) => {
        const current = ensure(get().byScenario, scenarioId);
        set({
          byScenario: {
            ...get().byScenario,
            [scenarioId]: {
              ...current,
              bonusInvestigations: current.bonusInvestigations + delta,
            },
          },
        });
      },

      setForceUnlocked: (scenarioId, clueId, unlocked) => {
        const current = ensure(get().byScenario, scenarioId);
        const forced = new Set(current.gmUnlockedClueIds);
        if (unlocked) forced.add(clueId);
        else forced.delete(clueId);
        set({
          byScenario: {
            ...get().byScenario,
            [scenarioId]: { ...current, gmUnlockedClueIds: [...forced] },
          },
        });
      },

      setViewed: (scenarioId, clueId, viewed, options) => {
        const current = ensure(get().byScenario, scenarioId);
        const already = current.viewedClueIds.includes(clueId);
        if (already === viewed) return;

        const charge = options?.charge ?? 0;
        const viewedAt = { ...current.viewedAt };
        let viewedClueIds: ClueId[];
        let spent: number;

        if (viewed) {
          viewedClueIds = [...current.viewedClueIds, clueId];
          viewedAt[clueId] = Date.now();
          spent = current.spent + charge;
        } else {
          viewedClueIds = current.viewedClueIds.filter((id) => id !== clueId);
          delete viewedAt[clueId];
          spent = Math.max(0, current.spent - charge);
        }

        set({
          byScenario: {
            ...get().byScenario,
            [scenarioId]: {
              ...current,
              viewedClueIds,
              viewedAt,
              spent,
              startedAt: current.startedAt ?? (viewed ? Date.now() : null),
            },
          },
        });
      },
    }),
    {
      name: 'mm.progress.v1',
      version: 1,
      partialize: (state) => ({ byScenario: state.byScenario }),
    },
  ),
);

/** 시나리오의 진행 상태를 구독한다 (없으면 안정된 기본값) */
export function useScenarioProgress(scenarioId: ScenarioId): ScenarioProgress {
  return useProgressStore((s) => s.byScenario[scenarioId] ?? emptyScenarioProgress);
}
