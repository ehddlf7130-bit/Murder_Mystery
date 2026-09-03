import { describe, expect, it } from 'vitest';
import {
  areaProgress,
  buildClueStates,
  canRevealHint,
  chargeForHint,
  clueCost,
  describeUnmetRequires,
  emptyProgress,
  hintCost,
  remainingHints,
  remainingInvestigations,
  specialCluesUnlockedBy,
  totalHints,
  type ProgressSnapshot,
} from './clueRules';
import { makeScenario } from './testScenario';

const scenario = makeScenario();

function progress(overrides: Partial<ProgressSnapshot> = {}): ProgressSnapshot {
  return { ...emptyProgress, ...overrides };
}

describe('clueCost', () => {
  it('선행조건 없는 단서는 1회 차감', () => {
    expect(clueCost(scenario.clues.find((c) => c.id === 'a')!)).toBe(1);
  });

  it('선행조건이 있는 특수 단서는 무료', () => {
    expect(clueCost(scenario.clues.find((c) => c.id === 'tier1')!)).toBe(0);
  });

  it('시나리오가 cost를 명시하면 그 값이 우선한다', () => {
    expect(clueCost({ ...scenario.clues[0]!, cost: 3 })).toBe(3);
    expect(clueCost({ ...scenario.clues[2]!, cost: 1 })).toBe(1);
  });
});

describe('buildClueStates', () => {
  it('초기 상태에서 진입 단서만 열람 가능하고 특수 단서는 잠긴다', () => {
    const states = buildClueStates(scenario, progress());
    expect(states.get('a')!.status).toBe('available');
    expect(states.get('b')!.status).toBe('available');
    expect(states.get('tier1')!.status).toBe('locked');
    expect(states.get('tier2')!.status).toBe('locked');
  });

  it('하위 단서를 모두 열람하면 1차 특수 단서가 무료로 해제된다', () => {
    const states = buildClueStates(scenario, progress({ viewedClueIds: ['a', 'b'], spent: 2 }));
    const tier1 = states.get('tier1')!;
    expect(tier1.status).toBe('available');
    expect(tier1.cost).toBe(0);
    expect(tier1.unmetRequires).toHaveLength(0);
  });

  it('열람 횟수를 다 써도 비용 0인 특수 단서는 열 수 있다', () => {
    const states = buildClueStates(scenario, progress({ viewedClueIds: ['a', 'b'], spent: 2 }));
    expect(remainingInvestigations(scenario, progress({ spent: 2 }))).toBe(0);
    expect(states.get('tier1')!.status).toBe('available');
  });

  it('잠금만 풀린 상태로는 다음 단계의 선행조건을 만족하지 않는다', () => {
    // tier1이 해제되었을 뿐 아직 열람하지 않았다면 tier2는 여전히 잠김
    const unlockedOnly = buildClueStates(scenario, progress({ viewedClueIds: ['a', 'b'] }));
    expect(unlockedOnly.get('tier1')!.status).toBe('available');
    expect(unlockedOnly.get('tier2')!.status).toBe('locked');

    // tier1을 실제로 열람하면 tier2가 연쇄 해제된다
    const viewed = buildClueStates(scenario, progress({ viewedClueIds: ['a', 'b', 'tier1'] }));
    expect(viewed.get('tier2')!.status).toBe('available');
  });

  it('남은 횟수가 비용보다 적으면 insufficient', () => {
    const states = buildClueStates(scenario, progress({ viewedClueIds: ['a'], spent: 2 }));
    expect(states.get('b')!.status).toBe('insufficient');
  });

  it('심판 강제 해제는 선행조건을 우회한다', () => {
    const states = buildClueStates(scenario, progress({ gmUnlockedClueIds: ['tier2'] }));
    const tier2 = states.get('tier2')!;
    expect(tier2.status).toBe('available');
    expect(tier2.gmUnlocked).toBe(true);
    // 미충족 선행조건 정보 자체는 그대로 남아 심판이 상황을 볼 수 있다
    expect(tier2.unmetRequires.map((c) => c.id)).toEqual(['tier1']);
  });

  it('심판 조정분이 총 횟수에 반영된다', () => {
    expect(remainingInvestigations(scenario, progress({ bonusInvestigations: 3 }))).toBe(5);
    expect(remainingInvestigations(scenario, progress({ bonusInvestigations: -5 }))).toBe(0);
  });

  it('hiddenUntilUnlocked 단서는 잠긴 동안 목록에 노출되지 않는다', () => {
    const locked = buildClueStates(scenario, progress());
    expect(locked.get('hidden')!.visible).toBe(false);

    const unlocked = buildClueStates(scenario, progress({ viewedClueIds: ['a'] }));
    expect(unlocked.get('hidden')!.visible).toBe(true);
  });
});

describe('areaProgress', () => {
  it('감춰진 단서는 총계에서도 제외해 진행도가 스포일러가 되지 않는다', () => {
    const states = buildClueStates(scenario, progress());
    // 선실의 단서 4개 중 hidden(감춰짐)과 tier1(특수)은 제외 → 2개
    expect(areaProgress('room', scenario, states)).toEqual({ viewed: 0, total: 2 });
  });

  it('열람한 개수를 센다', () => {
    const states = buildClueStates(scenario, progress({ viewedClueIds: ['a'], spent: 1 }));
    // hidden이 해제되어 총계에 들어온다
    expect(areaProgress('room', scenario, states)).toEqual({ viewed: 1, total: 3 });
  });

  it('구역에 놓인 특수 단서는 구역 진행도에 넣지 않는다', () => {
    // tier1은 location이 room이지만 특수 단서라 구역 화면에 나오지 않는다.
    const states = buildClueStates(
      scenario,
      progress({ viewedClueIds: ['a', 'b', 'tier1'], spent: 2 }),
    );
    expect(states.get('tier1')!.status).toBe('viewed');
    // 열람했어도 구역 총계·열람 수 어디에도 잡히지 않는다 (a·b·hidden 3개 중 2개)
    expect(areaProgress('room', scenario, states)).toEqual({ viewed: 2, total: 3 });
  });
});

describe('describeUnmetRequires', () => {
  it('단서 이름을 노출하지 않고 위치와 개수만 요약한다', () => {
    const states = buildClueStates(scenario, progress());
    const summary = describeUnmetRequires(states.get('tier1')!.unmetRequires, scenario);
    expect(summary).toEqual(['선실에서 확인할 것 2개']);
    expect(summary.join()).not.toContain('단서 A');
  });

  it('소지품 위치는 인물 이름으로 표기한다', () => {
    const states = buildClueStates(scenario, progress({ viewedClueIds: ['a', 'b'] }));
    // tier2의 미충족 선행조건은 tier1(선실)
    expect(describeUnmetRequires(states.get('tier2')!.unmetRequires, scenario)).toEqual([
      '선실에서 확인할 것 1개',
    ]);
  });
});

// ─────────────────────────── 힌트 ───────────────────────────
// 힌트는 열람 예산과 **완전히 분리된** 예산을 쓴다.
// 테스트 시나리오: a(hint, 비용 1) · b(hint, hintCost 0) · 나머지는 힌트 없음
// totalInvestigations 2 / totalHints 1

describe('hintCost', () => {
  it('미지정이면 1회', () => {
    expect(hintCost(scenario.clues.find((c) => c.id === 'a')!)).toBe(1);
  });

  it('0으로 지정하면 무료 — 진행 필수 힌트를 예산 밖에 둘 수 있다', () => {
    expect(hintCost(scenario.clues.find((c) => c.id === 'b')!)).toBe(0);
  });
});

describe('remainingHints', () => {
  it('총 힌트에서 소모분을 뺀다', () => {
    expect(remainingHints(scenario, progress())).toBe(1);
    expect(remainingHints(scenario, progress({ hintsSpent: 1 }))).toBe(0);
  });

  it('심판 가감분이 총량에 반영된다', () => {
    expect(totalHints(scenario, progress({ bonusHints: 3 }))).toBe(4);
    expect(remainingHints(scenario, progress({ bonusHints: 3, hintsSpent: 2 }))).toBe(2);
  });

  it('음수로 내려가지 않는다', () => {
    expect(totalHints(scenario, progress({ bonusHints: -99 }))).toBe(0);
    expect(remainingHints(scenario, progress({ hintsSpent: 99 }))).toBe(0);
  });
});

describe('힌트 상태', () => {
  const hintOf = (p: ProgressSnapshot, id: string) =>
    buildClueStates(scenario, p).get(id)!.hint;

  it('힌트가 없는 단서는 none', () => {
    expect(hintOf(progress(), 'tier1').status).toBe('none');
  });

  it('본문을 열람하기 전에는 살 수 없다', () => {
    const hint = hintOf(progress(), 'a');
    expect(hint.status).toBe('clueUnviewed');
    expect(canRevealHint(hint)).toBe(false);
  });

  it('본문을 열람하면 구매 가능해진다', () => {
    const hint = hintOf(progress({ viewedClueIds: ['a'] }), 'a');
    expect(hint.status).toBe('available');
    expect(canRevealHint(hint)).toBe(true);
    expect(chargeForHint(hint)).toBe(1);
  });

  it('힌트 예산이 부족하면 insufficient', () => {
    const hint = hintOf(progress({ viewedClueIds: ['a'], hintsSpent: 1 }), 'a');
    expect(hint.status).toBe('insufficient');
    expect(canRevealHint(hint)).toBe(false);
  });

  it('무료 힌트는 예산이 0이어도 열린다', () => {
    const hint = hintOf(progress({ viewedClueIds: ['b'], hintsSpent: 1 }), 'b');
    expect(hint.status).toBe('available');
    expect(chargeForHint(hint)).toBe(0);
  });

  it('구매한 힌트는 재열람이 무료다', () => {
    const hint = hintOf(
      progress({ viewedClueIds: ['a'], revealedHintClueIds: ['a'], hintsSpent: 1 }),
      'a',
    );
    expect(hint.status).toBe('revealed');
    expect(canRevealHint(hint)).toBe(true);
    expect(chargeForHint(hint)).toBe(0);
  });

  it('열람 예산을 다 써도 힌트 예산은 그대로다', () => {
    const p = progress({ viewedClueIds: ['a'], spent: 2 });
    expect(remainingInvestigations(scenario, p)).toBe(0);
    expect(hintOf(p, 'a').status).toBe('available');
  });

  it('힌트 예산을 다 써도 단서 열람에는 영향이 없다', () => {
    const p = progress({ hintsSpent: 1 });
    expect(remainingHints(scenario, p)).toBe(0);
    expect(buildClueStates(scenario, p).get('a')!.status).toBe('available');
  });
});

describe('specialCluesUnlockedBy', () => {
  /** 열람 **직전** 상태를 만들어 넘긴다 — 판정 시점이 그때이기 때문이다 */
  function unlockedBy(clueId: string, p: ProgressSnapshot = progress()) {
    return specialCluesUnlockedBy(clueId, buildClueStates(scenario, p)).map(
      (c) => c.id,
    );
  }

  it('마지막 선행조건을 열면 그 특수 단서가 해제된다', () => {
    expect(unlockedBy('b', progress({ viewedClueIds: ['a'], spent: 1 }))).toEqual([
      'tier1',
    ]);
  });

  it('선행조건이 남아 있으면 아무것도 해제되지 않는다', () => {
    expect(unlockedBy('a')).toEqual([]);
  });

  it('특수 단서가 아닌 게이팅 단서는 반환되지 않는다', () => {
    // hidden도 'a'를 선행조건으로 갖지만 special이 없다.
    expect(unlockedBy('a')).not.toContain('hidden');
  });

  it('특수 단서가 다음 특수 단서를 해제하는 연쇄도 잡는다', () => {
    const p = progress({ viewedClueIds: ['a', 'b'], spent: 2 });
    expect(unlockedBy('tier1', p)).toEqual(['tier2']);
  });

  it('이미 열람한 단서를 다시 열면 해제되는 것이 없다', () => {
    const p = progress({ viewedClueIds: ['a', 'b'], spent: 2 });
    expect(unlockedBy('a', p)).toEqual([]);
  });

  it('심판이 이미 강제 해제한 특수 단서는 다시 알리지 않는다', () => {
    const p = progress({
      viewedClueIds: ['a'],
      spent: 1,
      gmUnlockedClueIds: ['tier1'],
    });
    expect(unlockedBy('b', p)).toEqual([]);
  });
});
