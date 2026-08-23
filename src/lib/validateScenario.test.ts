import { describe, expect, it } from 'vitest';
import type { Clue } from '@/types/scenario';
import { listScenarios } from '@/data';
import { validateScenario } from './validateScenario';
import { makeScenario } from './testScenario';

const errorsOf = (scenario: Parameters<typeof validateScenario>[0]) =>
  validateScenario(scenario).filter((i) => i.severity === 'error');

describe('등록된 모든 시나리오', () => {
  // 현장에서 단서가 안 열리는 사고를 막는 CI 게이트.
  it.each(listScenarios().map((s) => [s.title, s] as const))(
    '%s — 데이터 오류가 없다',
    (_title, scenario) => {
      expect(errorsOf(scenario)).toEqual([]);
    },
  );
});

describe('validateScenario', () => {
  it('정상 시나리오는 오류가 없다', () => {
    expect(errorsOf(makeScenario())).toEqual([]);
  });

  it('존재하지 않는 선행 단서를 잡아낸다', () => {
    const scenario = makeScenario();
    scenario.clues = scenario.clues.map((c) =>
      c.id === 'tier1' ? { ...c, requires: ['a', 'ghost'] } : c,
    );
    const errors = errorsOf(scenario);
    expect(errors.some((e) => e.message.includes('ghost'))).toBe(true);
  });

  it('선행조건 순환을 잡아낸다', () => {
    const scenario = makeScenario();
    scenario.clues = scenario.clues.map((c) => {
      if (c.id === 'a') return { ...c, requires: ['b'] };
      if (c.id === 'b') return { ...c, requires: ['a'] };
      return c;
    });
    const errors = errorsOf(scenario);
    expect(errors.some((e) => e.message.includes('순환'))).toBe(true);
    // 진입 단서가 사라진 것도 함께 지적한다
    expect(errors.some((e) => e.where === 'scenario:clues')).toBe(true);
  });

  it('자기 자신을 선행조건으로 두면 오류', () => {
    const scenario = makeScenario();
    scenario.clues = scenario.clues.map((c) =>
      c.id === 'a' ? { ...c, requires: ['a'] } : c,
    );
    expect(errorsOf(scenario).some((e) => e.message.includes('자기 자신'))).toBe(true);
  });

  it('범인이 0명이거나 2명이면 오류', () => {
    const none = makeScenario();
    none.characters = none.characters.map((c) => ({ ...c, isCulprit: false }));
    expect(errorsOf(none).some((e) => e.where === 'scenario:characters')).toBe(true);

    const two = makeScenario();
    two.characters = [
      ...two.characters,
      { ...two.characters[0]!, id: 'second', name: '또 다른 범인' },
    ];
    expect(errorsOf(two).some((e) => e.where === 'scenario:characters')).toBe(true);
  });

  it('범인 지목 문항의 정답이 isCulprit과 다르면 오류', () => {
    const scenario = makeScenario();
    scenario.characters = [
      ...scenario.characters,
      {
        id: 'innocent',
        name: '무고한 사람',
        job: '요리사',
        publicProfile: '공개',
        backstory: '배경',
        goals: [],
        isCulprit: false,
      },
    ];
    scenario.quiz = [
      { ...scenario.quiz[0], answerCharacterId: 'innocent' } as (typeof scenario.quiz)[number],
    ];
    expect(errorsOf(scenario).some((e) => e.message.includes('isCulprit'))).toBe(true);
  });

  it('존재하지 않는 구역·인물을 가리키는 단서를 잡아낸다', () => {
    const scenario = makeScenario();
    const broken: Clue[] = [
      { id: 'x', name: 'X', location: { kind: 'area', areaId: 'nowhere' }, requires: [], body: 'x' },
      {
        id: 'y',
        name: 'Y',
        location: { kind: 'belonging', characterId: 'nobody' },
        requires: [],
        body: 'y',
      },
    ];
    scenario.clues = [...scenario.clues, ...broken];
    const errors = errorsOf(scenario);
    expect(errors.some((e) => e.where === 'clue:x')).toBe(true);
    expect(errors.some((e) => e.where === 'clue:y')).toBe(true);
  });

  it('specialCategories에 없는 카테고리를 잡아낸다', () => {
    const scenario = makeScenario();
    scenario.clues = scenario.clues.map((c) =>
      c.id === 'tier1'
        ? { ...c, special: { category: 'unknown', lockedLabel: '???' } }
        : c,
    );
    expect(errorsOf(scenario).some((e) => e.message.includes('unknown'))).toBe(true);
  });

  it('중복 ID를 잡아낸다', () => {
    const scenario = makeScenario();
    scenario.clues = [...scenario.clues, { ...scenario.clues[0]! }];
    expect(errorsOf(scenario).some((e) => e.message.includes('중복'))).toBe(true);
  });

  it('선택지에 없는 정답을 잡아낸다', () => {
    const scenario = makeScenario({
      quiz: [
        {
          kind: 'choice',
          id: 'q',
          prompt: '?',
          points: 10,
          options: [{ id: 'a', text: 'A' }],
          answerOptionId: 'z',
          explanation: '해설',
        },
      ],
    });
    expect(errorsOf(scenario).some((e) => e.message.includes('z'))).toBe(true);
  });

  it('총 열람 횟수가 유료 단서를 전부 덮으면 밸런스 경고를 남긴다', () => {
    const scenario = makeScenario({ totalInvestigations: 99 });
    const warnings = validateScenario(scenario).filter((i) => i.severity === 'warning');
    expect(warnings.some((w) => w.where === 'scenario:totalInvestigations')).toBe(true);
  });
});
