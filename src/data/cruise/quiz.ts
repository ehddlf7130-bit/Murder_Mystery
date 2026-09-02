import type { QuizQuestion } from '@/types/scenario';

/**
 * ⚠️ 임시 문항 — 아직 확정 원고가 아니다.
 *
 * 시나리오의 사실관계(범인·사인·동기)에는 맞춰 두었지만, 문구와 배점은 검토가 필요하다.
 * 확정할 때 content/cruise.md에 `## 채점 문항` 섹션을 추가해 원고로 관리한다.
 *
 * 배점 합계 100점.
 */
export const quiz: QuizQuestion[] = [
  {
    kind: 'culprit',
    id: 'q-culprit',
    prompt: '손남일을 살해한 사람은 누구입니까?',
    points: 40,
    answerCharacterId: 'baek',
    explanation:
      '정밀 부검이 사인을 약물 중독에서 질식으로 뒤집고, 기도에서 나온 깃털과 면섬유가 침대 아래 떨어진 베개를 가리킵니다. 22시 40분 손남일과 함께 3층 복도로 들어간 사람은 대리인과 백강윤뿐이며, 대리인은 그를 방에 앉혀둔 뒤 곧 물러났습니다. 객실에 남은 두 번째 잔의 지문은 백강윤의 것입니다.',
  },
  {
    kind: 'choice',
    id: 'q-method',
    prompt: '살해 방법은 무엇입니까?',
    points: 20,
    options: [
      { id: 'a', text: '샴페인에 탄 펜타닐로 중독시켰다' },
      { id: 'b', text: '베개로 얼굴을 눌러 질식시켰다' },
      { id: 'c', text: '목을 졸라 살해한 뒤 침대에 눕혔다' },
      { id: 'd', text: '위스키에 탄 수면제로 사망에 이르게 했다' },
    ],
    answerOptionId: 'b',
    explanation:
      '혈중 펜타닐은 치사량의 3분의 1에 그쳐 사인이 아닙니다. 기도에서 깃털과 면섬유가 검출되었고, 침대 아래 떨어진 베개 안쪽에는 말라붙은 타액과 옅은 혈흔이 남아 있었습니다.',
  },
  {
    kind: 'multi',
    id: 'q-evidence',
    prompt: '범인을 특정하는 데 결정적이었던 단서를 모두 고르세요.',
    points: 20,
    partialCredit: true,
    options: [
      { id: 'a', text: '정밀 부검 결과' },
      { id: 'b', text: '순찰 일지 22시 40분' },
      { id: 'c', text: '정현호의 소지품' },
      { id: 'd', text: '대리인의 서류 봉투' },
    ],
    answerOptionIds: ['a', 'b'],
    explanation:
      '정밀 부검이 사인을 질식으로 바꾸고, 순찰 일지가 그 시각 객실에 손남일과 함께 있던 사람을 백강윤으로 좁힙니다. 정현호의 소지품과 대리인의 서류 봉투는 각각 마약 유통과 공급을 드러낼 뿐 살인과는 이어지지 않습니다.',
  },
  {
    kind: 'text',
    id: 'q-motive',
    prompt: '범인의 동기를 한 문장으로 적어 주세요.',
    points: 20,
    keywords: ['폭로', '마약'],
    keywordsRequired: 1,
    explanation:
      '3년 전 백강윤의 마약 투약을 세상에 터뜨린 사람이 손남일이었습니다. 그날 밤 손남일이 취해 그 사실을 자백했고, 그 말이 방아쇠가 되었습니다.',
  },
];
