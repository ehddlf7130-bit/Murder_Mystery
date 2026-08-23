import { useCallback, useMemo, useState } from 'react';
import type { ClueId, Scenario } from '@/types/scenario';
import {
  buildClueStates,
  remainingInvestigations,
  type ClueState,
} from '@/lib/clueRules';
import { useProgressStore, useScenarioProgress } from '@/store/progressStore';

/**
 * 단서 열람 플로우 한 곳 관리.
 *
 * 공용 노트북은 여러 명이 돌려가며 조작하므로 오클릭 한 번이 열람 예산을 태운다.
 * 그래서 **횟수가 차감되는 열람만** 확인 다이얼로그를 거치게 하고,
 * 재열람(무료)과 특수 단서(비용 0)는 마찰 없이 즉시 열어 준다.
 */
export function useClueViewer(scenario: Scenario) {
  const progress = useScenarioProgress(scenario.id);
  const viewClue = useProgressStore((s) => s.viewClue);

  const states = useMemo(
    () => buildClueStates(scenario, progress),
    [scenario, progress],
  );
  const remaining = remainingInvestigations(scenario, progress);

  /** 차감 확인을 기다리는 단서 */
  const [pendingId, setPendingId] = useState<ClueId | null>(null);
  /** 본문이 열려 있는 단서 */
  const [openId, setOpenId] = useState<ClueId | null>(null);

  const open = useCallback(
    (clueId: ClueId) => {
      if (viewClue(scenario, clueId)) setOpenId(clueId);
    },
    [scenario, viewClue],
  );

  /** 카드 클릭 진입점 — 상태에 따라 즉시 열거나 확인을 띄운다 */
  const request = useCallback(
    (clueId: ClueId) => {
      const state = states.get(clueId);
      if (!state) return;

      switch (state.status) {
        case 'viewed':
          // 재열람은 차감이 없으니 확인 절차도 없다.
          setOpenId(clueId);
          return;
        case 'available':
          if (state.cost === 0) open(clueId);
          else setPendingId(clueId);
          return;
        case 'locked':
        case 'insufficient':
          // 잠김/횟수 부족은 카드 자체가 이유를 보여준다.
          return;
      }
    },
    [states, open],
  );

  const confirmPending = useCallback(() => {
    if (pendingId === null) return;
    const clueId = pendingId;
    setPendingId(null);
    open(clueId);
  }, [pendingId, open]);

  const cancelPending = useCallback(() => setPendingId(null), []);
  const close = useCallback(() => setOpenId(null), []);

  const pendingState: ClueState | null = pendingId
    ? (states.get(pendingId) ?? null)
    : null;
  const openState: ClueState | null = openId
    ? (states.get(openId) ?? null)
    : null;

  return {
    states,
    remaining,
    request,
    pendingState,
    openState,
    confirmPending,
    cancelPending,
    close,
  };
}

export type ClueViewer = ReturnType<typeof useClueViewer>;
