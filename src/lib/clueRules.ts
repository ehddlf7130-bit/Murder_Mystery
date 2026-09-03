import type {
  AreaId,
  Clue,
  ClueId,
  ClueLocation,
  Scenario,
} from '@/types/scenario';

/**
 * 단서 게이팅·비용·열람 가능 여부의 단일 진실 공급원.
 * UI 컴포넌트는 절대 직접 계산하지 않고 여기를 경유한다.
 */

/** 스토어와 분리된 순수 입력 형태 (테스트 용이성) */
export interface ProgressSnapshot {
  /** 열람 완료한 단서 ID (열람 순서) */
  viewedClueIds: readonly ClueId[];
  /** 지금까지 소모한 열람 횟수 */
  spent: number;
  /** 심판이 강제 해제한 단서 ID */
  gmUnlockedClueIds: readonly ClueId[];
  /** 심판이 조정한 총 횟수 가감분 (음수 가능) */
  bonusInvestigations: number;
  /** 힌트를 구매한 단서 ID */
  revealedHintClueIds: readonly ClueId[];
  /** 지금까지 소모한 힌트 횟수 */
  hintsSpent: number;
  /** 심판이 조정한 총 힌트 가감분 (음수 가능) */
  bonusHints: number;
}

export const emptyProgress: ProgressSnapshot = {
  viewedClueIds: [],
  spent: 0,
  gmUnlockedClueIds: [],
  bonusInvestigations: 0,
  revealedHintClueIds: [],
  hintsSpent: 0,
  bonusHints: 0,
};

export type ClueStatus =
  /** 이미 열람함 — 언제든 무료로 다시 볼 수 있다 */
  | 'viewed'
  /** 잠금 해제되었고 남은 횟수도 충분하다 */
  | 'available'
  /** 선행조건 미충족 */
  | 'locked'
  /** 잠금은 풀렸지만 남은 열람 횟수가 부족하다 */
  | 'insufficient';

export type HintStatus =
  /** 이 단서에는 힌트가 없다 */
  | 'none'
  /** 이미 구매함 — 언제든 무료로 다시 볼 수 있다 */
  | 'revealed'
  /** 단서를 열람했고 남은 힌트도 충분하다 */
  | 'available'
  /** 단서 본문을 아직 열람하지 않았다 */
  | 'clueUnviewed'
  /** 열람은 했지만 남은 힌트 횟수가 부족하다 */
  | 'insufficient';

export interface HintState {
  status: HintStatus;
  /** 이 힌트를 처음 열람할 때 차감되는 힌트 횟수 */
  cost: number;
}

export interface ClueState {
  clue: Clue;
  status: ClueStatus;
  /** 이 단서를 처음 열람할 때 차감되는 횟수 */
  cost: number;
  /** 아직 열람하지 않은 선행 단서들 */
  unmetRequires: Clue[];
  /** 심판이 강제 해제해 준 상태인지 */
  gmUnlocked: boolean;
  /** 목록에 노출해도 되는지 (hiddenUntilUnlocked 처리) */
  visible: boolean;
  /** 힌트 구매 상태 — 열람 예산과 별개로 계산된다 */
  hint: HintState;
}

/**
 * 열람 비용. 선행조건이 있는 단서(= 특수 단서)는 하위 단서를 모은 것 자체가
 * 보상이므로 기본 0회. 시나리오에서 `cost`를 명시하면 그 값이 우선한다.
 */
export function clueCost(clue: Clue): number {
  return clue.cost ?? (clue.requires.length > 0 ? 0 : 1);
}

/** 총 허용 횟수 (심판 조정분 포함). 음수로는 내려가지 않는다 */
export function totalInvestigations(
  scenario: Scenario,
  progress: ProgressSnapshot,
): number {
  return Math.max(0, scenario.totalInvestigations + progress.bonusInvestigations);
}

/** 남은 열람 횟수 */
export function remainingInvestigations(
  scenario: Scenario,
  progress: ProgressSnapshot,
): number {
  return Math.max(0, totalInvestigations(scenario, progress) - progress.spent);
}

/**
 * 힌트 열람 비용. 미지정 시 1회.
 * `0`이면 무료 — 진행에 꼭 필요한 길잡이 힌트를 예산 밖에 둘 때 쓴다.
 */
export function hintCost(clue: Clue): number {
  return clue.hintCost ?? 1;
}

/** 총 허용 힌트 횟수 (심판 조정분 포함) */
export function totalHints(
  scenario: Scenario,
  progress: ProgressSnapshot,
): number {
  return Math.max(0, scenario.totalHints + progress.bonusHints);
}

/** 남은 힌트 횟수 */
export function remainingHints(
  scenario: Scenario,
  progress: ProgressSnapshot,
): number {
  return Math.max(0, totalHints(scenario, progress) - progress.hintsSpent);
}

/**
 * 시나리오 전체의 단서 상태를 한 번에 계산한다.
 * 컴포넌트에서는 useMemo로 감싸 한 번만 계산하고 Map을 조회해 쓴다.
 */
export function buildClueStates(
  scenario: Scenario,
  progress: ProgressSnapshot,
): Map<ClueId, ClueState> {
  const viewed = new Set(progress.viewedClueIds);
  const gmUnlocked = new Set(progress.gmUnlockedClueIds);
  const revealedHints = new Set(progress.revealedHintClueIds);
  const byId = new Map(scenario.clues.map((c) => [c.id, c]));
  const remaining = remainingInvestigations(scenario, progress);
  const hintsLeft = remainingHints(scenario, progress);

  const states = new Map<ClueId, ClueState>();

  for (const clue of scenario.clues) {
    const cost = clueCost(clue);
    const isViewed = viewed.has(clue.id);
    const forced = gmUnlocked.has(clue.id);

    // 선행조건은 "열람 완료"로만 충족된다. 잠금만 풀린 상태로는 부족하다.
    const unmetRequires = clue.requires
      .filter((id) => !viewed.has(id))
      .map((id) => byId.get(id))
      .filter((c): c is Clue => c !== undefined);

    const unlocked = forced || unmetRequires.length === 0;

    let status: ClueStatus;
    if (isViewed) {
      status = 'viewed';
    } else if (!unlocked) {
      status = 'locked';
    } else if (remaining < cost) {
      status = 'insufficient';
    } else {
      status = 'available';
    }

    // 힌트는 본문을 연 뒤에야 살 수 있다. 예산도 열람 예산과 따로 센다.
    const hCost = hintCost(clue);
    let hintStatus: HintStatus;
    if (!clue.hint) {
      hintStatus = 'none';
    } else if (revealedHints.has(clue.id)) {
      hintStatus = 'revealed';
    } else if (!isViewed) {
      hintStatus = 'clueUnviewed';
    } else if (hintsLeft < hCost) {
      hintStatus = 'insufficient';
    } else {
      hintStatus = 'available';
    }

    states.set(clue.id, {
      clue,
      status,
      cost,
      unmetRequires,
      gmUnlocked: forced,
      visible: !(clue.hiddenUntilUnlocked && status === 'locked'),
      hint: { status: hintStatus, cost: hCost },
    });
  }

  return states;
}

/** 열람(또는 재열람) 가능한가 */
export function canView(state: ClueState): boolean {
  return state.status === 'viewed' || state.status === 'available';
}

/** 이 단서를 여는 데 실제로 차감될 횟수 (재열람은 0) */
export function chargeFor(state: ClueState): number {
  return state.status === 'viewed' ? 0 : state.cost;
}

/** 힌트를 열람(또는 재열람)할 수 있는가 */
export function canRevealHint(hint: HintState): boolean {
  return hint.status === 'revealed' || hint.status === 'available';
}

/** 이 힌트를 여는 데 실제로 차감될 힌트 횟수 (재열람은 0) */
export function chargeForHint(hint: HintState): number {
  return hint.status === 'revealed' ? 0 : hint.cost;
}

/**
 * `viewedClueId`를 여는 것이 마지막 선행조건이어서 새로 해제되는 특수 단서들.
 *
 * 열람 **직전** 상태만으로 판정한다 — 스토어가 갱신된 뒤에는 이미 해제 상태라
 * "방금 해제되었다"를 구분할 수 없기 때문이다.
 * 목록 순서는 시나리오 정의 순서를 따른다 (Map의 삽입 순서).
 */
export function specialCluesUnlockedBy(
  viewedClueId: ClueId,
  statesBefore: Map<ClueId, ClueState>,
): Clue[] {
  const unlocked: Clue[] = [];
  for (const state of statesBefore.values()) {
    if (!state.clue.special) continue;
    if (state.status !== 'locked') continue;
    // 남은 미충족 선행조건이 지금 여는 그 단서 하나뿐일 때만 해제된다.
    if (state.unmetRequires.length !== 1) continue;
    if (state.unmetRequires[0]!.id !== viewedClueId) continue;
    unlocked.push(state.clue);
  }
  return unlocked;
}

// ─────────────────────────── 표시용 헬퍼 ───────────────────────────

/** "의무실" / "정하람의 소지품" */
export function locationLabel(
  location: ClueLocation,
  scenario: Scenario,
): string {
  if (location.kind === 'area') {
    return (
      scenario.areas.find((a) => a.id === location.areaId)?.name ?? '알 수 없는 구역'
    );
  }
  const name =
    scenario.characters.find((c) => c.id === location.characterId)?.name ??
    '알 수 없는 인물';
  return `${name}의 소지품`;
}

/**
 * 잠긴 단서의 해제 조건을 **단서 이름 없이** 위치로만 요약한다.
 * 정답을 흘리지 않으면서 플레이어가 목표를 인지할 수 있게 하는 것이 목적.
 * 예: ["의무실에서 확인할 것 2개", "VIP 객실에서 확인할 것 1개"]
 */
export function describeUnmetRequires(
  unmet: readonly Clue[],
  scenario: Scenario,
): string[] {
  const counts = new Map<string, number>();
  for (const clue of unmet) {
    const label = locationLabel(clue.location, scenario);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts].map(([label, n]) => `${label}에서 확인할 것 ${n}개`);
}

/**
 * 맵의 구역 화면에 나열되는 단서인지.
 *
 * 특수 단서는 위치가 구역이더라도 **'특수 단서' 탭에서만** 다룬다 —
 * 소지품 단서와 같은 취급이다. 그래야 특수 단서가 어느 구역에 걸려 있는지가
 * 맵에서 미리 새어 나가지 않고, 해제 여부도 한 곳에서만 관리된다.
 */
export function isAreaListedClue(clue: Clue, areaId: AreaId): boolean {
  if (clue.special) return false;
  return clue.location.kind === 'area' && clue.location.areaId === areaId;
}

/** 구역별 열람 진행도 — 구역 카드 배지에 쓴다 */
export function areaProgress(
  areaId: string,
  scenario: Scenario,
  states: Map<ClueId, ClueState>,
): { viewed: number; total: number } {
  let viewed = 0;
  let total = 0;
  for (const clue of scenario.clues) {
    if (!isAreaListedClue(clue, areaId)) continue;
    const state = states.get(clue.id);
    // 아직 감춰진 단서는 총계에서도 빼야 진행도가 스포일러가 되지 않는다.
    if (!state?.visible) continue;
    total += 1;
    if (state.status === 'viewed') viewed += 1;
  }
  return { viewed, total };
}
