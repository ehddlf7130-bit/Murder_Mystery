import type { Character } from '@/types/scenario';

/** ⚠️ 더미 데이터 — 구조 검증용 최소 텍스트. 확정 시나리오로 교체 예정 */
export const characters: Character[] = [
  {
    id: 'captain',
    name: '하선우',
    job: '선장',
    emoji: '🧭',
    publicProfile:
      '이 배를 12년간 몰아온 베테랑 선장. 어젯밤에는 조타실에 있었다고 주장한다.',
    backstory:
      '(더미) 당신은 이 항로의 마지막 운항을 맡았다. 회장이 배를 매각하려 한다는 사실을 며칠 전에 알게 되었다.',
    goals: [
      { id: 'g1', text: '(더미) 매각 계획이 당신 귀에 들어간 사실을 숨긴다.' },
      { id: 'g2', text: '(더미) 진범을 지목해 선장으로서의 명예를 지킨다.' },
    ],
    secrets: ['(더미) 어젯밤 23시경 조타실을 15분간 비웠다.'],
    isCulprit: false,
  },
  {
    id: 'doctor',
    name: '문지혜',
    job: '선의(船醫)',
    emoji: '💉',
    publicProfile:
      '승선 3개월차 의무실 담당. 시신을 가장 먼저 확인한 사람이다.',
    backstory:
      '(더미) 당신은 면허 정지 이력을 숨기고 이 배에 올랐다. 회장은 그 사실을 알고 있었다.',
    goals: [
      { id: 'g1', text: '(더미) 면허 문제를 끝까지 들키지 않는다.' },
      { id: 'g2', text: '(더미) 사라진 약병의 행방에 대한 의심을 돌린다.' },
    ],
    secrets: ['(더미) 투약 기록 한 줄을 지웠다.'],
    isCulprit: false,
  },
  {
    id: 'singer',
    name: '라비안',
    job: '무대 가수',
    emoji: '🎤',
    publicProfile:
      '선상 라운지의 전속 가수. 어젯밤 23시 30분까지 무대에 서 있었다.',
    backstory:
      '(더미) 당신은 회장과 오래된 계약 분쟁 중이었다. 어젯밤 무대가 끝난 뒤 회장을 만나러 갔다.',
    goals: [
      { id: 'g1', text: '(더미) 회장과 만난 사실 자체를 감춘다.' },
      { id: 'g2', text: '(더미) 계약서 원본을 되찾는다.' },
    ],
    secrets: ['(더미) VIP 객실 앞 복도에서 누군가와 마주쳤다.'],
    isCulprit: false,
  },
  {
    id: 'steward',
    name: '정하람',
    job: '객실 승무원',
    emoji: '🧹',
    publicProfile:
      'VIP 층 담당 승무원. 마스터키를 소지한 몇 명 중 하나다.',
    backstory:
      '(더미) 당신은 회장에게 가족을 잃었다. 이 배에 오른 이유는 처음부터 하나였다.',
    goals: [
      { id: 'g1', text: '(더미) 끝까지 지목당하지 않는다.' },
      { id: 'g2', text: '(더미) 마스터키 사용 기록이 드러나지 않게 한다.' },
    ],
    secrets: ['(더미) 의무실에서 약병 하나를 가져갔다.'],
    isCulprit: true,
  },
];
