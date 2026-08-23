import type { Area } from '@/types/scenario';

/** ⚠️ 더미 데이터 — 구조 검증용 최소 텍스트. 확정 시나리오로 교체 예정 */
export const areas: Area[] = [
  {
    id: 'lobby',
    name: '중앙 로비',
    emoji: '🛎️',
    order: 1,
    description:
      '샹들리에가 흔들리는 3층 높이의 로비. 어젯밤 파티의 흔적이 아직 치워지지 않았다.',
  },
  {
    id: 'vip',
    name: 'VIP 객실',
    emoji: '🚪',
    order: 2,
    description:
      '피해자가 머물던 최상층 스위트룸. 문은 안쪽에서 잠겨 있었다고 한다.',
  },
  {
    id: 'medbay',
    name: '의무실',
    emoji: '🩺',
    order: 3,
    description: '선내 의무실. 약품 캐비닛 하나가 어정쩡하게 열려 있다.',
  },
  {
    id: 'deck',
    name: '상부 갑판',
    emoji: '🌊',
    order: 4,
    description: '바람이 거센 최상부 갑판. 승객 출입은 원칙적으로 금지된 구역이다.',
  },
];
