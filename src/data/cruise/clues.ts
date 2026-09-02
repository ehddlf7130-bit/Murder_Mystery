import type { Clue } from '@/types/scenario';

/**
 * 원고: content/cruise.md
 *
 * 게이팅 구조
 *   무료 현장 단서 3개 (해제조건 없음 · cost 0 명시)
 *   유료 단서 24개 (해제조건 없음 · 각 1회 차감)
 *   특수 단서 5개 (해제조건을 모두 충족하면 열람 · 무료)
 *   └─ 박세현의 소지품 (유료 1개 요구)
 *      └─ 정밀 부검 결과 (박세현의 소지품 + 1차 부검 소견서 + 떨어진 베개)
 *   └─ 나머지 특수 단서 3개 (각 유료 2개 요구 · 서로 독립)
 *
 * 특수 단서 5개를 전부 해제하는 최소 경로는 유료 9회. 총 32개.
 */

export const clues: Clue[] = [
  // ───────────────────────── 손남일의 객실 ─────────────────────────
  {
    id: 'body-state',
    name: '시신의 상태',
    location: { kind: 'area', areaId: 'victim-cabin' },
    requires: [],
    cost: 0,
    body: '손남일은 침대에 바르게 누운 자세다. 외상은 없고 입술과 손톱이 푸르게 변색되어 있으며, 눈꺼풀 안쪽에는 좁쌀만 한 붉은 점이 흩어져 있다. 사후경직 정도로 볼 때 사망은 00시에서 01시 사이로 추정된다.',
  },
  {
    id: 'two-glasses',
    name: '두 개의 잔',
    location: { kind: 'area', areaId: 'victim-cabin' },
    requires: [],
    cost: 0,
    body: '테이블에 샴페인 병 하나와 잔 두 개가 놓여 있다. 한 잔에서는 손남일의 지문이, 다른 잔에서는 신원이 특정되지 않은 지문이 검출되었다.',
  },
  {
    id: 'empty-closet',
    name: '비어 있는 옷장',
    location: { kind: 'area', areaId: 'victim-cabin' },
    requires: [],
    cost: 0,
    body: '옷장에는 안혜주의 짐이 절반가량 정리되어 있다. 외출용 코트와 구두 한 켤레가 있어야 할 자리가 비어 있다.',
  },
  {
    id: 'champagne',
    name: '마시다 만 샴페인',
    location: { kind: 'area', areaId: 'victim-cabin' },
    requires: [],
    body: '손남일의 객실에 샴페인 1병이 놓여 있다. 잔에는 아직 3분의 2가 남아 있다.',
    hint: '샴페인을 정밀검사해 본 결과 샴페인에는 펜타닐(마약) 성분이 들어있고, 검출된 지문은 손남일의 것 뿐이다.',
  },
  {
    id: 'fallen-pillow',
    name: '떨어진 베개',
    location: { kind: 'area', areaId: 'victim-cabin' },
    requires: [],
    body: '베개 하나가 침대 아래 떨어져 있다.',
    hint: '집어 보면 안쪽에 말라붙은 타액 자국과 옅게 번진 혈흔이 남아 있다.',
  },
  {
    id: 'carpet-stain',
    name: '카펫의 술 자국',
    location: { kind: 'area', areaId: 'victim-cabin' },
    requires: [],
    body: '쏟아진 술 자국이 문 쪽으로 이어진다. 여러 사람이 지나간 흔적이 아니라 한 사람이 같은 구간에서 반복해 비틀거린 궤적에 가깝다.',
  },
  {
    id: 'twisted-collar',
    name: '비틀린 셔츠 깃',
    location: { kind: 'area', areaId: 'victim-cabin' },
    requires: [],
    body: '손남일의 셔츠 깃이 한쪽으로 비틀려 늘어나 있다. 두 번째 단추가 떨어져 침대 밑에 굴러 있다.',
  },

  // ───────────────────────── 백강윤의 객실 ─────────────────────────
  {
    id: 'old-article',
    name: '오래된 기사 인쇄물',
    location: { kind: 'area', areaId: 'actor-cabin' },
    requires: [],
    body: '3년 전 백강윤의 마약 혐의를 다룬 기사 인쇄물이다.',
    hint: '그 무렵 안혜주와 백강윤은 한 영화의 주연이었고, 그 영화의 투자자는 손남일이었다.',
  },
  {
    id: 'handwritten-letter',
    name: '손남일의 손편지',
    location: { kind: 'area', areaId: 'actor-cabin' },
    requires: [],
    body: '초대권과 함께 들어 있던 짧은 편지. "백강윤, 그동안 고생했는데 크루즈 여행 어때?" 필체는 손남일의 것이다.',
  },

  // ───────────────────────── 객실 복도 ─────────────────────────
  {
    id: 'patrol-2240',
    name: '순찰 일지 22시 40분',
    location: { kind: 'area', areaId: 'corridor' },
    requires: [],
    body: '승무원 순찰 일지 기록. 22시 40분, 손남일과 그의 대리인 그리고 백강윤이 함께 3층 복도로 들어가는 것을 목격했다고 적혀 있다.',
  },
  {
    id: 'patrol-2310',
    name: '순찰 일지 23시 10분',
    location: { kind: 'area', areaId: 'corridor' },
    requires: [],
    body: '23시 10분, 안혜주가 혼자 엘리베이터로 상층에 올라갔다는 기록. 손에는 아무것도 들고 있지 않았다.',
  },
  {
    id: 'patrol-0005',
    name: '순찰 일지 00시 05분',
    location: { kind: 'area', areaId: 'corridor' },
    requires: [],
    body: '00시 05분, 3층 복도에서 선장을 만나 순찰 내용을 보고했다는 기록.',
    hint: '해당 승무원에게 물어본 결과, 선장은 보고를 듣고 아래층으로 내려갔다고 한다.',
  },

  // ───────────────────────── 연회홀 ─────────────────────────
  {
    id: 'guest-list',
    name: '파티 참석 명부',
    location: { kind: 'area', areaId: 'ballroom' },
    requires: [],
    body: '참석자 서명 목록과 현장 사진. 22시 30분까지는 이 배에 탄 다섯 사람 전원의 소재가 확인되며, 명부 끝에는 손남일의 수행원 한 명이 따로 서명해 두었다.',
  },
  {
    id: 'afternoon-quarrel',
    name: '오후의 언쟁',
    location: { kind: 'area', areaId: 'ballroom' },
    requires: [],
    body: '승무원 증언. 오후에 선장과 손남일이 객실 문제로 언쟁을 벌였고, 선장이 결국 고개를 숙여 사과하며 상황을 무마했다.',
  },
  {
    id: 'business-card',
    name: '자리 밑의 명함',
    location: { kind: 'area', areaId: 'ballroom' },
    requires: [],
    body: '손남일이 앉았던 자리 밑에서 설헌규의 명함이 나왔다. 뒷면에는 아무것도 적혀 있지 않다.',
  },

  // ───────────────────────── 라운지 카페 ─────────────────────────
  {
    id: 'receipt-0038',
    name: '00시 38분 영수증',
    location: { kind: 'area', areaId: 'lounge' },
    requires: [],
    body: "00시 38분에 커피를 결제한 영수증. 서명란에는 '박세현'이라고 적혀 있다.",
  },

  // ───────────────────────── 의무실 ─────────────────────────
  {
    id: 'first-autopsy',
    name: '1차 부검 소견서',
    location: { kind: 'area', areaId: 'medbay' },
    requires: [],
    body: '청색증 확인. 사망 당일 고인이 다량의 술을 마셨고 수면제를 처방받은 것으로 확인되어, 약물성 호흡억제에 의한 질식으로 추정된다는 소견이 적혀 있다. 작성자 설헌규.',
  },
  {
    id: 'drug-request',
    name: '약물 요청 기록',
    location: { kind: 'area', areaId: 'medbay' },
    requires: [],
    body: "20시경 손남일이 수면제를 요청했다는 접수 기록. 처리란에는 '객실 전달 완료'라고만 적혀 있다.",
  },
  {
    id: 'medical-waste',
    name: '의료용 폐기물통',
    location: { kind: 'area', areaId: 'medbay' },
    requires: [],
    body: '사용된 주사기와 빈 앰플 하나, 1회용 장갑, 소량의 피가 묻은 거즈가 들어 있다.',
    hint: '주사기와 빈 앰플은 깨끗하게 세척되어 있다.',
  },

  // ───────────────────────── 선장실 ─────────────────────────
  {
    id: 'letter-draft',
    name: '책상 위의 편지 초안',
    location: { kind: 'area', areaId: 'captain-room' },
    requires: [],
    body: "구겨진 채 버려진 편지 초안. '23시 20분, 선장실에서'라는 문장이 몇 번이나 고쳐 쓰여 있고 필체는 선장의 것이다.",
  },
  {
    id: 'sofa-hair',
    name: '소파의 머리카락',
    location: { kind: 'area', areaId: 'captain-room' },
    requires: [],
    body: '소파에서 여성용 긴 머리카락이 여러 가닥 발견되었다. 염색 톤이 안혜주의 것과 일치한다.',
  },
  {
    id: 'logbook-gap',
    name: '항해 일지의 공백',
    location: { kind: 'area', areaId: 'captain-room' },
    requires: [],
    body: "00시부터 00시 30분까지 선장이 자리를 비웠다는 기록. 사유는 '정기 점검'으로만 적혀 있고 구체적인 내용은 없다.",
  },

  // ───────────────────────── CCTV 통제실 ─────────────────────────
  {
    id: 'recorder-log',
    name: '녹화 장비 로그',
    location: { kind: 'area', areaId: 'cctv-room' },
    requires: [],
    body: '01시 30분까지 정상 녹화되었다는 것을 로그를 통해 확인했다.',
    hint: '영상이 존재했다면, 없앤 사람에게는 없앨 이유가 있었다.',
  },
  {
    id: 'masterkey',
    name: 'CCTV실 마스터키',
    location: { kind: 'area', areaId: 'cctv-room' },
    requires: [],
    body: '선내에서 마스터키를 소지한 사람은 선장과 기관장 둘뿐이다.',
  },
  {
    id: 'visit-requests',
    name: '통제실 방문 요청서',
    location: { kind: 'area', areaId: 'cctv-room' },
    requires: [],
    body: "반려 처리된 방문 요청서 2건. 둘 다 '박세현' 기자 명의이며, 사유는 모두 '취재'로 기재되어 있다.",
  },

  // ───────────────────────── 화물 창고 ─────────────────────────
  {
    id: 'moved-crates',
    name: '옮겨진 상자 자국',
    location: { kind: 'area', areaId: 'cargo' },
    requires: [],
    body: '컨테이너 바닥에 최근 무언가를 옮긴 자국이 남아 있다. 자국의 규격이 화물 명세서의 어떤 품목과도 맞지 않는다.',
  },
  {
    id: 'vacuum-wrapper',
    name: '진공 포장재 잔해',
    location: { kind: 'area', areaId: 'cargo' },
    requires: [],
    body: '구석에 찢어진 진공 포장재가 버려져 있고 바닥에도 흰 가루가 흩어져 있다.',
    hint: '흰 가루는 마약으로 추정되며, 선내 화물칸에는 같은 가루와 같은 포장재가 적재되어 있다.',
  },

  // ──────────────────────── 특수 단서 ────────────────────────
  // 원고 순서를 그대로 따른다. '대리인의 서류 봉투'는 연회홀 단서지만
  // 특수 단서라 원고에서도 이 블록에 놓여 있다.
  {
    id: 'sp-belongings-park',
    name: '박세현의 소지품',
    location: { kind: 'belonging', characterId: 'park' },
    requires: ['visit-requests'],
    special: { lockedLabel: '???' },
    body: [
      '카메라 가방에서 경찰 신분증과 수사 지휘서가 나온다. 박세현은 기자가 아니라 마약 유통 신고를 받고 잠입한 강력반 형사다.',
      '촬영본 대부분은 승객이 아니라 승무원 동선과 화물 구역을 향해 있다. 00시대에는 셀프 타임스탬프가 연속으로 남아 있어, 그 시간 라운지를 벗어나지 않았음이 확인된다.',
    ].join('\n\n'),
    hint: '이 사람이라면 정밀 부검을 정식으로 요청할 수 있다.',
  },
  {
    id: 'sp-agent-envelope',
    name: '대리인의 서류 봉투',
    location: { kind: 'area', areaId: 'ballroom' },
    requires: ['guest-list', 'business-card'],
    special: { lockedLabel: '???' },
    body: [
      '손남일의 수행원이 두고 간 서류 봉투에서 한 병원의 처방 기록 사본이 나온다. 펜타닐과 프로포폴을 비롯한 마약성 진통제가 100명이 넘는 환자 명의로 처방된 기록이며, 처방의는 전부 설헌규다.',
      '같은 봉투에 설헌규의 가족 신상이 정리된 문서가 함께 들어 있다. 주소와 학교, 등하교 동선까지 적혀 있다.',
    ].join('\n\n'),
    hint: '이 서류를 되찾고 싶어 하는 사람이 이 배에 있다.',
  },
  {
    id: 'sp-belongings-jung',
    name: '정현호의 소지품',
    location: { kind: 'belonging', characterId: 'jung' },
    requires: ['masterkey', 'moved-crates'],
    special: { lockedLabel: '???' },
    body: [
      '사물함 이중 바닥에서 CCTV 저장장치가 나온다. 봉인이 뜯기지 않아 단 한 번도 재생된 적이 없다.',
      '함께 나온 수기 장부에는 기항지별 날짜와 중량이 빼곡히 적혀 있다.',
    ].join('\n\n'),
  },
  {
    id: 'sp-belongings-ahn',
    name: '안혜주의 소지품',
    location: { kind: 'belonging', characterId: 'ahn' },
    requires: ['letter-draft', 'sofa-hair'],
    special: { lockedLabel: '???' },
    body: '객실 카드키가 두 장이고 그중 하나는 4층 전용이다. 옷깃에서는 남성용 향수 잔향이 확인된다.',
    hint: '이 사람은 그 시각 어디에 있었는지 아직 말하지 않았다.',
  },
  {
    id: 'sp-autopsy',
    name: '정밀 부검 결과',
    location: { kind: 'area', areaId: 'medbay' },
    requires: ['sp-belongings-park', 'first-autopsy', 'fallen-pillow'],
    special: { lockedLabel: '???' },
    body: [
      '혈중 펜타닐이 검출되었으나 농도는 치사량의 3분의 1에 그친다. 약물은 사인이 아니다.',
      '객실에서 수거한 샴페인 병에서도 같은 성분이 검출되며, 남은 양만으로도 치사량을 크게 넘는다. 피해자는 그 술을 거의 마시지 않았다.',
      '경부 전면에 압박흔, 결막에 점상출혈이 확인된다. 기도에서는 깃털과 면섬유가 검출되었다.',
      '사인은 경부 압박 및 안면 폐색에 의한 질식사. 사망 추정 시각은 00시 20분에서 00시 40분 사이다.',
    ].join('\n\n'),
    hint: '사인이 바뀌면 지금까지의 의심도 전부 다시 짜야 한다.',
  },
];
