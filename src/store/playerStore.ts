import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CharacterId, QuestionId, ScenarioId } from '@/types/scenario';
import type { Answer, AnswerMap } from '@/lib/scoring';

/**
 * 개인 모바일의 상태. 진행 상태(progressStore)와 완전히 분리되어 있어
 * 심판이 진행을 리셋해도 플레이어의 캐릭터 선택은 영향받지 않는다.
 */

export interface ScenarioPlayerState {
  characterId: CharacterId | null;
  /** 체크한 개인 목표 ID */
  completedGoalIds: string[];
  answers: AnswerMap;
  /** 제출 시각. null이면 아직 제출 전 */
  submittedAt: number | null;
}

/** 셀렉터가 매 렌더 새 객체를 반환하지 않도록 공유하는 기본값 */
export const emptyPlayerState: ScenarioPlayerState = {
  characterId: null,
  completedGoalIds: [],
  answers: {},
  submittedAt: null,
};

interface PlayerState {
  byScenario: Record<ScenarioId, ScenarioPlayerState>;

  /** 캐릭터를 고른다. 다른 캐릭터로 바꾸면 목표 체크와 답안이 초기화된다 */
  selectCharacter: (scenarioId: ScenarioId, characterId: CharacterId) => void;
  toggleGoal: (scenarioId: ScenarioId, goalId: string) => void;
  setAnswer: (
    scenarioId: ScenarioId,
    questionId: QuestionId,
    answer: Answer | undefined,
  ) => void;
  submit: (scenarioId: ScenarioId) => void;
  /** 심판: 재제출을 허용한다 (답안은 유지) */
  reopenSubmission: (scenarioId: ScenarioId) => void;
  /** 이 기기의 개인 데이터를 비운다 */
  resetPlayer: (scenarioId: ScenarioId) => void;
}

function ensure(
  byScenario: Record<ScenarioId, ScenarioPlayerState>,
  scenarioId: ScenarioId,
): ScenarioPlayerState {
  return byScenario[scenarioId] ?? emptyPlayerState;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => {
      const patch = (
        scenarioId: ScenarioId,
        changes: Partial<ScenarioPlayerState>,
      ) => {
        const current = ensure(get().byScenario, scenarioId);
        set({
          byScenario: {
            ...get().byScenario,
            [scenarioId]: { ...current, ...changes },
          },
        });
      };

      return {
        byScenario: {},

        selectCharacter: (scenarioId, characterId) => {
          const current = ensure(get().byScenario, scenarioId);
          if (current.characterId === characterId) return;
          // 캐릭터가 바뀌면 이전 캐릭터의 목표·답안은 의미가 없다.
          patch(scenarioId, {
            characterId,
            completedGoalIds: [],
            answers: {},
            submittedAt: null,
          });
        },

        toggleGoal: (scenarioId, goalId) => {
          const current = ensure(get().byScenario, scenarioId);
          const done = new Set(current.completedGoalIds);
          if (done.has(goalId)) done.delete(goalId);
          else done.add(goalId);
          patch(scenarioId, { completedGoalIds: [...done] });
        },

        setAnswer: (scenarioId, questionId, answer) => {
          const current = ensure(get().byScenario, scenarioId);
          // 제출 후에는 답안을 고칠 수 없다.
          if (current.submittedAt !== null) return;
          const answers = { ...current.answers };
          if (answer === undefined) delete answers[questionId];
          else answers[questionId] = answer;
          patch(scenarioId, { answers });
        },

        submit: (scenarioId) => {
          const current = ensure(get().byScenario, scenarioId);
          if (current.submittedAt !== null) return;
          patch(scenarioId, { submittedAt: Date.now() });
        },

        reopenSubmission: (scenarioId) => {
          patch(scenarioId, { submittedAt: null });
        },

        resetPlayer: (scenarioId) => {
          const next = { ...get().byScenario };
          delete next[scenarioId];
          set({ byScenario: next });
        },
      };
    },
    {
      name: 'mm.player.v1',
      version: 1,
      partialize: (state) => ({ byScenario: state.byScenario }),
    },
  ),
);

/** 시나리오의 개인 상태를 구독한다 (없으면 안정된 기본값) */
export function useScenarioPlayer(scenarioId: ScenarioId): ScenarioPlayerState {
  return usePlayerStore((s) => s.byScenario[scenarioId] ?? emptyPlayerState);
}
