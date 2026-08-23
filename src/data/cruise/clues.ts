import type { Clue, SpecialCategoryMeta } from '@/types/scenario';

/**
 * ⚠️ 더미 데이터 — 구조 검증용 최소 텍스트. 확정 시나리오로 교체 예정.
 *
 * 게이팅 구조는 실제 게임에서 쓸 형태를 그대로 갖췄다:
 *   일반 단서 8개 (requires: [], 1회 차감)
 *   └─ 1차 특수 단서 2개 (일반 단서 2개씩 요구, 무료)
 *      └─ 2차 특수 단서 2개 (1차 특수 단서 + 일반 단서 요구, 무료)
 */

export const specialCategories: SpecialCategoryMeta[] = [
  { key: 'autopsy', label: '부검 · 사인', emoji: '🔬' },
  { key: 'cctv', label: 'CCTV 기록', emoji: '📹' },
  { key: 'belongings', label: '개인 소지품', emoji: '🎒' },
  { key: 'alibi', label: '알리바이 정황', emoji: '🕰️' },
];

export const clues: Clue[] = [
  // ───────────────────────── 중앙 로비 ─────────────────────────
  {
    id: 'lobby-guestbook',
    name: '파티 방명록',
    location: { kind: 'area', areaId: 'lobby' },
    requires: [],
    body: '(더미) 어젯밤 파티 참석자 서명 목록. 마지막 서명 시각은 23시 12분이다.',
    hint: '누가 언제까지 로비에 있었는지 대조해 볼 수 있다.',
  },
  {
    id: 'lobby-champagne',
    name: '깨진 샴페인 잔',
    location: { kind: 'area', areaId: 'lobby' },
    requires: [],
    body: '(더미) 로비 구석에서 발견된 깨진 잔. 립스틱 자국이 남아 있다.',
  },

  // ───────────────────────── VIP 객실 ─────────────────────────
  {
    id: 'vip-body',
    name: '피해자의 시신',
    location: { kind: 'area', areaId: 'vip' },
    requires: [],
    body: '(더미) 회장 백도훤. 외상은 뚜렷하지 않고, 목덜미에 작은 붉은 점이 있다.',
    hint: '의무실에서 정밀하게 살펴볼 필요가 있어 보인다.',
  },
  {
    id: 'vip-safe',
    name: '열려 있는 금고',
    location: { kind: 'area', areaId: 'vip' },
    requires: [],
    body: '(더미) 비어 있는 객실 금고. 억지로 열린 흔적은 없다.',
  },

  // ───────────────────────── 의무실 ─────────────────────────
  {
    id: 'medbay-chart',
    name: '투약 기록부',
    location: { kind: 'area', areaId: 'medbay' },
    requires: [],
    body: '(더미) 어젯밤 항목 하나가 지워진 흔적이 있다. 필압만 종이에 남았다.',
    hint: '시신의 상태와 함께 놓고 보면 의미가 생긴다.',
  },
  {
    id: 'medbay-vial',
    name: '사라진 약병',
    location: { kind: 'area', areaId: 'medbay' },
    requires: [],
    body: '(더미) 약품 캐비닛의 재고표와 실물이 하나 어긋난다. 진정제 계열 약품이다.',
  },

  // ───────────────────────── 상부 갑판 ─────────────────────────
  {
    id: 'deck-railing',
    name: '난간의 긁힌 흔적',
    location: { kind: 'area', areaId: 'deck' },
    requires: [],
    body: '(더미) 난간 도장이 최근에 긁혀 있다. 아래는 곧바로 바다다.',
  },
  {
    id: 'deck-cctv-box',
    name: 'CCTV 제어함',
    location: { kind: 'area', areaId: 'deck' },
    requires: [],
    body: '(더미) 제어함이 잠겨 있지 않다. 어젯밤 특정 시간대 기록만 따로 분리되어 있다.',
    hint: '분리된 구간을 복원하려면 그 시간대에 누가 어디 있었는지부터 알아야 한다.',
  },

  // ─────────────────── 1차 특수 단서 (일반 단서 2개 요구) ───────────────────
  {
    id: 'sp-autopsy',
    name: '부검 정밀 결과',
    location: { kind: 'area', areaId: 'medbay' },
    requires: ['vip-body', 'medbay-chart'],
    special: {
      category: 'autopsy',
      lockedLabel: '??? — 부검 정밀 결과',
      lockedTeaser: '시신과 의무 기록을 함께 확보하면 정밀 감정이 가능하다.',
    },
    body: '(더미) 사인은 약물에 의한 호흡 억제. 주사 흔적은 목덜미 한 곳뿐이다.',
    hint: '이 약물을 손에 넣을 수 있었던 사람은 많지 않다.',
  },
  {
    id: 'sp-cctv',
    name: 'CCTV 23시 47분 구간',
    location: { kind: 'area', areaId: 'deck' },
    requires: ['deck-cctv-box', 'lobby-guestbook'],
    special: {
      category: 'cctv',
      lockedLabel: '??? — 삭제된 CCTV 구간',
      lockedTeaser: '제어함과 그 시각의 참석자 명단이 모두 필요하다.',
    },
    body: '(더미) 복원된 영상. 23시 47분, 승무원 제복을 입은 인물이 VIP 층 복도로 들어간다.',
  },

  // ─────────────── 2차 특수 단서 (1차 특수 단서를 선행조건으로) ───────────────
  {
    id: 'sp-belongings-steward',
    name: '정하람의 소지품',
    location: { kind: 'belonging', characterId: 'steward' },
    requires: ['sp-autopsy', 'medbay-vial'],
    special: {
      category: 'belongings',
      lockedLabel: '??? — 어느 인물의 소지품',
      lockedTeaser: '사인이 특정되고 없어진 약품이 확인되면 소지품 검사 근거가 생긴다.',
    },
    body: '(더미) 제복 안주머니에서 빈 약병과 오래된 신문 스크랩이 나온다.',
  },
  {
    id: 'sp-alibi',
    name: '23시~24시 동선 대조표',
    location: { kind: 'area', areaId: 'lobby' },
    requires: ['sp-cctv', 'deck-railing'],
    // 로비 목록에는 해제 전까지 나타나지 않는다 (특수 단서 탭에서는 잠김 상태로 보인다).
    hiddenUntilUnlocked: true,
    special: {
      category: 'alibi',
      lockedLabel: '??? — 동선 대조표',
      lockedTeaser: '복원된 영상과 갑판의 흔적을 맞춰야 표를 완성할 수 있다.',
    },
    body: '(더미) 네 사람의 진술을 시간축에 겹쳐 놓으면, 23시 40분대가 비어 있는 사람은 한 명이다.',
  },
];
