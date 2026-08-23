import { describe, expect, it } from 'vitest';
import {
  areaProgress,
  buildClueStates,
  clueCost,
  describeUnmetRequires,
  emptyProgress,
  remainingInvestigations,
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
    // 선실의 단서 4개 중 hidden은 제외 → 3개
    expect(areaProgress('room', scenario, states)).toEqual({ viewed: 0, total: 3 });
  });

  it('열람한 개수를 센다', () => {
    const states = buildClueStates(scenario, progress({ viewedClueIds: ['a'], spent: 1 }));
    // hidden이 해제되어 총계에 들어온다
    expect(areaProgress('room', scenario, states)).toEqual({ viewed: 1, total: 4 });
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
