import type { Clue, Scenario } from '@/types/scenario';

/**
 * 테스트용 최소 시나리오 빌더.
 * 게이팅 규칙을 좁게 검증하려면 실제 시나리오보다 작은 데이터가 낫다.
 */
export function makeScenario(overrides: Partial<Scenario> = {}): Scenario {
  const clues: Clue[] = [
    {
      id: 'a',
      name: '단서 A',
      location: { kind: 'area', areaId: 'room' },
      requires: [],
      body: 'A',
      hint: 'A의 힌트',
    },
    {
      id: 'b',
      name: '단서 B',
      location: { kind: 'area', areaId: 'room' },
      requires: [],
      body: 'B',
      hint: 'B의 힌트',
      hintCost: 0,
    },
    {
      id: 'tier1',
      name: '1차 특수',
      location: { kind: 'area', areaId: 'room' },
      requires: ['a', 'b'],
      body: 'T1',
      special: { lockedLabel: '??? — 1차', lockedTeaser: '둘을 모아라' },
    },
    {
      id: 'tier2',
      name: '2차 특수',
      location: { kind: 'belonging', characterId: 'suspect' },
      requires: ['tier1'],
      body: 'T2',
      // 유료 힌트를 2개로 만들어 기본 예산(1)이 전부를 덮지 않게 한다 —
      // 기본 시나리오가 밸런스 경고를 내면 진짜 회귀를 가린다.
      hint: 'T2의 힌트',
      special: { lockedLabel: '??? — 2차' },
    },
    {
      id: 'hidden',
      name: '숨은 단서',
      location: { kind: 'area', areaId: 'room' },
      requires: ['a'],
      body: 'H',
      hiddenUntilUnlocked: true,
    },
  ];

  return {
    id: 'test',
    title: '테스트 시나리오',
    tagline: '테스트',
    playerCount: '4인',
    playtime: '30분',
    synopsis: '테스트',
    totalInvestigations: 2,
    totalHints: 1,
    characters: [
      {
        id: 'suspect',
        name: '용의자',
        job: '승무원',
        publicProfile: '공개',
        backstory: '배경',
        goals: [{ id: 'g1', text: '목표' }],
        isCulprit: true,
      },
    ],
    areas: [{ id: 'room', name: '선실', description: '방', order: 1 }],
    clues,
    quiz: [
      {
        kind: 'culprit',
        id: 'q1',
        prompt: '범인은?',
        points: 10,
        answerCharacterId: 'suspect',
        explanation: '해설',
      },
    ],
    epilogue: '진상',
    ...overrides,
  };
}
