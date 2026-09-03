import { describe, expect, it } from 'vitest';
import type { Area, DeckMeta } from '@/types/scenario';
import { buildClueStates, emptyProgress } from './clueRules';
import { deckLabel, deckOf, groupAreasByDeck } from './decks';
import { makeScenario } from './testScenario';

/** 테스트 시나리오의 단일 구역('room')을 여러 개로 늘린다 */
function withAreas(areas: Area[], decks?: DeckMeta[]) {
  const scenario = makeScenario({ decks });
  scenario.areas = areas;
  return scenario;
}

const decks = [
  { id: 'top', level: 3, name: '상층', note: '출입 금지' },
  { id: 'mid', level: 2, name: '중층' },
  { id: 'bottom', level: 1, name: '하층' },
];

const areas: Area[] = [
  { id: 'room', name: '선실', description: '방', order: 1, deckId: 'mid' },
  { id: 'bridge', name: '조타실', description: '조타', order: 2, deckId: 'top' },
  { id: 'hold', name: '선창', description: '창고', order: 3, deckId: 'bottom' },
  { id: 'deck2', name: '갑판', description: '갑판', order: 4, deckId: 'top' },
];

const states = (s: ReturnType<typeof makeScenario>) =>
  buildClueStates(s, emptyProgress);

describe('deckLabel', () => {
  it('층수와 이름을 합쳐 표시한다', () => {
    expect(deckLabel(decks[0]!)).toBe('3층 · 상층');
  });
});

describe('deckOf', () => {
  it('구역이 속한 층을 찾는다', () => {
    const scenario = withAreas(areas, decks);
    expect(deckOf(areas[1], scenario)?.id).toBe('top');
  });

  it('층 미지정이거나 decks가 없으면 undefined', () => {
    expect(deckOf(areas[0], makeScenario())).toBeUndefined();
    const noDeck: Area = { id: 'x', name: 'X', description: '', order: 1 };
    expect(deckOf(noDeck, withAreas(areas, decks))).toBeUndefined();
    expect(deckOf(undefined, withAreas(areas, decks))).toBeUndefined();
  });
});

describe('groupAreasByDeck', () => {
  it('층을 높은 곳부터 내림차순으로 쌓는다', () => {
    const scenario = withAreas(areas, decks);
    const sections = groupAreasByDeck(scenario, states(scenario));
    expect(sections.map((s) => s.deck?.id)).toEqual(['top', 'mid', 'bottom']);
  });

  it('층 안에서는 order 오름차순으로 정렬한다', () => {
    const scenario = withAreas(areas, decks);
    const top = groupAreasByDeck(scenario, states(scenario))[0]!;
    expect(top.areas.map((a) => a.id)).toEqual(['bridge', 'deck2']);
  });

  it('decks가 없으면 섹션 하나로 평평하게 묶는다 (기존 동작 유지)', () => {
    const scenario = withAreas(areas);
    const sections = groupAreasByDeck(scenario, states(scenario));
    expect(sections).toHaveLength(1);
    expect(sections[0]!.deck).toBeNull();
    expect(sections[0]!.areas).toHaveLength(4);
  });

  it('소속 구역이 없는 층은 섹션을 만들지 않는다', () => {
    const scenario = withAreas(
      areas.filter((a) => a.deckId !== 'bottom'),
      decks,
    );
    expect(
      groupAreasByDeck(scenario, states(scenario)).map((s) => s.deck?.id),
    ).toEqual(['top', 'mid']);
  });

  it('층 미지정·없는 층을 가리키는 구역은 맨 뒤 기타 섹션으로 모은다', () => {
    const scenario = withAreas(
      [
        ...areas,
        { id: 'orphan', name: '미배정', description: '', order: 5 },
        { id: 'ghost', name: '유령층', description: '', order: 6, deckId: 'nope' },
      ],
      decks,
    );
    const sections = groupAreasByDeck(scenario, states(scenario));
    const last = sections.at(-1)!;
    expect(last.deck).toBeNull();
    expect(last.areas.map((a) => a.id)).toEqual(['orphan', 'ghost']);
  });

  it('층 진행도는 소속 구역의 열람 수를 합산한다', () => {
    // 테스트 시나리오의 구역 단서는 'room'에 있고, 감춰진 것 1개와
    // 특수 단서 1개(tier1)를 빼면 2개다
    const scenario = makeScenario({ decks });
    scenario.areas = [
      { id: 'room', name: '선실', description: '방', order: 1, deckId: 'mid' },
    ];
    const before = groupAreasByDeck(scenario, states(scenario));
    expect(before[0]!.progress).toEqual({ viewed: 0, total: 2 });

    const after = groupAreasByDeck(
      scenario,
      buildClueStates(scenario, { ...emptyProgress, viewedClueIds: ['a'] }),
    );
    // 'a'를 열람하면 hidden 단서가 해제되어 총계에 들어온다
    expect(after[0]!.progress).toEqual({ viewed: 1, total: 3 });
  });
});
