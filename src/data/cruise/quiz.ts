import type { QuizQuestion } from '@/types/scenario';

/**
 * ⚠️ 더미 데이터 — 구조 검증용. 확정 시나리오로 교체 예정.
 * 네 가지 문항 유형(culprit / choice / multi / text)을 모두 한 번씩 사용해
 * 채점 로직이 전부 검증되게 해 두었다. 배점 합계 100점.
 */
export const quiz: QuizQuestion[] = [
  {
    kind: 'culprit',
    id: 'q-culprit',
    prompt: '회장 백도훤을 살해한 사람은 누구입니까?',
    points: 40,
    answerCharacterId: 'steward',
    explanation:
      '(더미) 복원된 CCTV의 제복 인물, 사라진 진정제, 소지품에서 나온 빈 약병이 한 사람을 가리킵니다.',
  },
  {
    kind: 'choice',
    id: 'q-method',
    prompt: '살해 방법은 무엇입니까?',
    points: 20,
    options: [
      { id: 'a', text: '둔기로 머리를 내리쳤다' },
      { id: 'b', text: '진정제를 과다 투여했다' },
      { id: 'c', text: '갑판에서 밀어 떨어뜨렸다' },
      { id: 'd', text: '샴페인에 독을 넣었다' },
    ],
    answerOptionId: 'b',
    explanation:
      '(더미) 부검 정밀 결과의 사인은 약물에 의한 호흡 억제이며, 주사 흔적은 목덜미 한 곳뿐입니다.',
  },
  {
    kind: 'multi',
    id: 'q-evidence',
    prompt: '범인을 특정하는 데 결정적이었던 근거를 모두 고르세요.',
    points: 20,
    partialCredit: true,
    options: [
      { id: 'a', text: '의무실에서 사라진 약병' },
      { id: 'b', text: '깨진 샴페인 잔의 립스틱' },
      { id: 'c', text: '23시 47분 CCTV 구간' },
      { id: 'd', text: '비어 있는 객실 금고' },
    ],
    answerOptionIds: ['a', 'c'],
    explanation:
      '(더미) 약병은 수단을, CCTV는 기회를 증명합니다. 잔과 금고는 다른 인물의 사정에 얽힌 교란 정보입니다.',
  },
  {
    kind: 'text',
    id: 'q-motive',
    prompt: '범인의 동기를 한 문장으로 적어 주세요.',
    points: 20,
    keywords: ['가족', '복수'],
    keywordsRequired: 1,
    explanation:
      '(더미) 범인은 과거 회장에게 가족을 잃었고, 처음부터 그 목적으로 이 배에 올랐습니다.',
  },
];
