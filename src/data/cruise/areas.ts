import type { Area, DeckMeta } from '@/types/scenario';

/**
 * 층 구분. 맵 화면은 level 내림차순으로 쌓아 배의 단면도처럼 보여준다.
 * note는 원고에 이미 있는 설정이라 새 정보를 흘리지 않는다.
 */
export const decks: DeckMeta[] = [
  { id: 'bridge', level: 4, name: '브리지 데크', note: '승객 출입 금지' },
  { id: 'cabin', level: 3, name: '객실 데크', note: '사건 현장' },
  { id: 'public', level: 2, name: '퍼블릭 데크' },
  { id: 'lower', level: 1, name: '하부 데크', note: '승무원 계단으로만 접근' },
];

/**
 * 원고: content/cruise.md
 * ⚠️ id는 URL에 그대로 노출되므로(/board/map/:areaId) 영문으로 유지한다.
 */
export const areas: Area[] = [
  {
    id: 'victim-cabin',
    name: '손남일의 객실',
    emoji: '🚪',
    order: 1,
    deckId: 'cabin',
    description:
      '피해자가 머물던 3층 객실. 아내와 함께 쓰던 방이지만 짐은 한 사람 분량만 정리되어 있다. 커튼은 닫혀 있고, 샴페인 냄새가 아직 남아 있다.',
  },
  {
    id: 'actor-cabin',
    name: '백강윤의 객실',
    emoji: '🎬',
    order: 2,
    deckId: 'cabin',
    description:
      '같은 층 반대편 끝. 침대 위에 사람이 누웠던 자국이 그대로 남아 있고, 옷과 짐이 아무렇게나 흩어져 있다.',
  },
  {
    id: 'corridor',
    name: '객실 복도',
    emoji: '🚶',
    order: 3,
    deckId: 'cabin',
    description:
      '3층 객실 구역을 잇는 좁은 복도. 승무원 순찰이 정기적으로 도는 구간이며, 카펫에는 밤사이 오간 흔적이 그대로 눌려 있다.',
  },
  {
    id: 'ballroom',
    name: '연회홀',
    emoji: '🥂',
    order: 4,
    deckId: 'public',
    description:
      '어젯밤 파티가 열린 2층 홀. 치우다 만 잔과 접시가 그대로 놓여 있고, 참석자 명부가 입구 테이블에 펼쳐져 있다.',
  },
  {
    id: 'lounge',
    name: '라운지 카페',
    emoji: '☕',
    order: 5,
    deckId: 'public',
    description:
      '2층 선미 쪽 라운지. 24시간 운영되며 주류 반출도 이곳을 거친다. 창가 자리 하나만 유독 오래 사용된 흔적이 있다.',
  },
  {
    id: 'medbay',
    name: '의무실',
    emoji: '🩺',
    order: 6,
    deckId: 'public',
    description:
      '선내 의무진이 쓰는 방. 약품 캐비닛과 장부가 나란히 놓여 있고, 시신은 이곳으로 옮겨져 1차 검안을 마친 상태다.',
  },
  {
    id: 'captain-room',
    name: '선장실',
    emoji: '🧭',
    order: 7,
    deckId: 'bridge',
    description:
      '4층 브리지 옆 선장 전용 공간. 승객 출입은 원칙적으로 금지되어 있다. 소파에 눌린 자국이 남아 있고 공기에 향수 냄새가 옅게 배어 있다.',
  },
  {
    id: 'cctv-room',
    name: 'CCTV 통제실',
    emoji: '📹',
    order: 8,
    deckId: 'bridge',
    description:
      '브리지 안쪽의 좁은 방. 모니터에는 선내 각 구역이 실시간으로 비치고 있고 녹화 장비도 정상 작동 중이다. 다만 저장장치 슬롯이 비어 있다.',
  },
  {
    id: 'cargo',
    name: '화물 창고',
    emoji: '📦',
    order: 9,
    deckId: 'lower',
    description:
      '1층 최하부 화물 구역. 승무원 계단으로만 접근할 수 있고 조명이 어둡다. 컨테이너 사이 바닥에 최근 무언가를 끌어낸 자국이 있다.',
  },
];
