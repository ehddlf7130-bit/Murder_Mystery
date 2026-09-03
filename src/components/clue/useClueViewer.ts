import { useCallback, useMemo, useState } from 'react';
import type { Clue, ClueId, Scenario } from '@/types/scenario';
import {
  buildClueStates,
  remainingHints,
  remainingInvestigations,
  specialCluesUnlockedBy,
  type ClueState,
} from '@/lib/clueRules';
import { useProgressStore, useScenarioProgress } from '@/store/progressStore';

/**
 * 단서 열람 플로우 한 곳 관리.
 *
 * 공용 노트북은 여러 명이 돌려가며 조작하므로 오클릭 한 번이 열람 예산을 태운다.
 * 그래서 **횟수가 차감되는 열람만** 확인 다이얼로그를 거치게 하고,
 * 재열람(무료)과 특수 단서(비용 0)는 마찰 없이 즉시 열어 준다.
 *
 * 특수 단서 해제 알림 큐도 여기서 관리한다 — 해제는 선행 단서를 여는 순간
 * 일어나므로, 그 열람을 실제로 수행하는 이 훅만이 "방금 해제되었다"를 알 수 있다.
 */
export function useClueViewer(scenario: Scenario) {
  const progress = useScenarioProgress(scenario.id);
  const viewClue = useProgressStore((s) => s.viewClue);
  const revealHint = useProgressStore((s) => s.revealHint);

  const states = useMemo(
    () => buildClueStates(scenario, progress),
    [scenario, progress],
  );
  const remaining = remainingInvestigations(scenario, progress);
  const hintsRemaining = remainingHints(scenario, progress);

  /** 차감 확인을 기다리는 단서 */
  const [pendingId, setPendingId] = useState<ClueId | null>(null);
  /** 본문이 열려 있는 단서 */
  const [openId, setOpenId] = useState<ClueId | null>(null);
  /** 열린 단서의 힌트 구매 확인 단계인지 */
  const [hintConfirming, setHintConfirming] = useState(false);
  /** 해제되었지만 아직 안내하지 않은 특수 단서 */
  const [unlockQueue, setUnlockQueue] = useState<Clue[]>([]);

  /** 다른 단서를 열 때 이전 단서의 힌트 확인 단계가 따라오면 안 된다 */
  const openAt = useCallback((clueId: ClueId) => {
    setOpenId(clueId);
    setHintConfirming(false);
  }, []);

  const open = useCallback(
    (clueId: ClueId) => {
      // 해제 판정은 반드시 viewClue 호출 **전에** — 갱신 뒤에는 이미 해제 상태다.
      const unlocked = specialCluesUnlockedBy(clueId, states);
      if (!viewClue(scenario, clueId)) return;
      openAt(clueId);
      if (unlocked.length > 0) setUnlockQueue((q) => [...q, ...unlocked]);
    },
    [scenario, viewClue, openAt, states],
  );

  /** 카드 클릭 진입점 — 상태에 따라 즉시 열거나 확인을 띄운다 */
  const request = useCallback(
    (clueId: ClueId) => {
      const state = states.get(clueId);
      if (!state) return;

      switch (state.status) {
        case 'viewed':
          // 재열람은 차감이 없으니 확인 절차도 없다.
          openAt(clueId);
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
    [states, open, openAt],
  );

  const confirmPending = useCallback(() => {
    if (pendingId === null) return;
    const clueId = pendingId;
    setPendingId(null);
    open(clueId);
  }, [pendingId, open]);

  const cancelPending = useCallback(() => setPendingId(null), []);

  const close = useCallback(() => {
    setOpenId(null);
    setHintConfirming(false);
  }, []);

  /**
   * 힌트 구매는 본문 모달 안에서 인라인 2단계로 처리한다.
   * 모달 위에 또 모달을 띄우면 z-index가 DOM 순서에 의존하고
   * Escape 한 번에 두 개가 같이 닫힌다.
   */
  const requestHint = useCallback(() => {
    if (!openId) return;
    const hint = states.get(openId)?.hint;
    if (!hint) return;
    if (hint.status === 'revealed') return;
    if (hint.status !== 'available') return;
    // 무료 힌트는 확인 단계 없이 바로 연다.
    if (hint.cost === 0) revealHint(scenario, openId);
    else setHintConfirming(true);
  }, [openId, states, revealHint, scenario]);

  const confirmHint = useCallback(() => {
    if (openId) revealHint(scenario, openId);
    setHintConfirming(false);
  }, [openId, revealHint, scenario]);

  const cancelHint = useCallback(() => setHintConfirming(false), []);

  /**
   * 해제 알림은 본문·확인 모달이 **모두 닫혀 있을 때만** 띄운다.
   * 해제는 선행 단서 본문을 읽는 중에 일어나므로 모달을 닫은 직후가 알림 시점이고,
   * 모달 위에 모달을 겹치면 z-index와 Escape가 DOM 순서에 끌려간다.
   */
  const unlockedSpecials = useMemo(() => {
    if (openId !== null || pendingId !== null) return [];
    // 심판 초기화나 다른 경로로 이미 열람된 단서는 큐에서 떨어뜨린다.
    return unlockQueue.filter((clue) => {
      const status = states.get(clue.id)?.status;
      return status === 'available' || status === 'insufficient';
    });
  }, [unlockQueue, openId, pendingId, states]);

  const dismissUnlocked = useCallback(() => setUnlockQueue([]), []);

  /** 알림에서 바로 열람 — 큐에서 먼저 빼야 본문 모달과 겹치지 않는다 */
  const openUnlocked = useCallback(
    (clueId: ClueId) => {
      setUnlockQueue((q) => q.filter((c) => c.id !== clueId));
      request(clueId);
    },
    [request],
  );

  const pendingState: ClueState | null = pendingId
    ? (states.get(pendingId) ?? null)
    : null;
  const openState: ClueState | null = openId
    ? (states.get(openId) ?? null)
    : null;

  return {
    states,
    remaining,
    hintsRemaining,
    request,
    pendingState,
    openState,
    confirmPending,
    cancelPending,
    close,
    hintConfirming,
    requestHint,
    confirmHint,
    cancelHint,
    unlockedSpecials,
    dismissUnlocked,
    openUnlocked,
  };
}

export type ClueViewer = ReturnType<typeof useClueViewer>;
