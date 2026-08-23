/**
 * 시나리오 데이터 계약.
 *
 * 새 시나리오를 추가할 때 UI 코드는 건드리지 않는다 —
 * `src/data/<id>/` 폴더를 만들어 이 타입을 만족하는 Scenario 객체를 export하고
 * `src/data/index.ts`의 레지스트리에 등록하면 끝.
 */

export type ScenarioId = string;
export type CharacterId = string;
export type AreaId = string;
export type ClueId = string;
export type QuestionId = string;

export interface Scenario {
  id: ScenarioId;
  title: string;
  /** 시나리오 선택 화면 카드에 한 줄로 붙는 홍보 문구 */
  tagline: string;
  /** "4~5인" */
  playerCount: string;
  /** "30~60분" */
  playtime: string;
  /** 게임 시작 시 심판이 낭독하는 도입부 */
  synopsis: string;
  /** 게임 전체에 허용되는 총 단서 열람 횟수 */
  totalInvestigations: number;
  characters: Character[];
  areas: Area[];
  clues: Clue[];
  /** 특수 단서 탭의 섹션 순서와 라벨. `Clue.special.category`와 key로 연결된다 */
  specialCategories: SpecialCategoryMeta[];
  quiz: QuizQuestion[];
  /** 채점 완료 후 공개되는 진상 */
  epilogue: string;
}

export interface Character {
  id: CharacterId;
  name: string;
  job: string;
  emoji?: string;
  /** 전원에게 공개되는 소개. 공용 화면에도 노출된다 */
  publicProfile: string;
  /** 본인 개인 화면에서만 보이는 배경 서사 */
  backstory: string;
  goals: CharacterGoal[];
  /** 본인만 아는 비밀. 개인 화면에서만 노출 */
  secrets?: string[];
  /** 채점 판정과 심판 패널에서만 참조된다. 플레이어 화면에 절대 노출하지 않음 */
  isCulprit: boolean;
}

export interface CharacterGoal {
  id: string;
  text: string;
}

export interface Area {
  id: AreaId;
  name: string;
  emoji?: string;
  /** 구역 진입 시 보여주는 장면 묘사 */
  description: string;
  /** 목록 정렬 순서 (작은 값이 먼저) */
  order: number;
}

/** 단서가 놓인 곳: 맵 구역 또는 특정 인물의 소지품 */
export type ClueLocation =
  | { kind: 'area'; areaId: AreaId }
  | { kind: 'belonging'; characterId: CharacterId };

export interface Clue {
  id: ClueId;
  name: string;
  location: ClueLocation;
  /** 열람 시 보여주는 본문 */
  body: string;
  /** 다음에 무엇을 볼지 유도하는 방향성 힌트 */
  hint?: string;
  /**
   * 선행 단서 ID 목록. 빈 배열이면 처음부터 열람 가능.
   * 여기 적힌 단서를 **모두 열람 완료**해야 해제된다.
   * 상위 단서 ID를 넣으면 상위 단서 간 선후 관계도 그대로 표현된다.
   */
  requires: ClueId[];
  /**
   * 열람 시 차감되는 횟수. 미지정 시 `clueCost()`가 결정한다
   * (선행조건이 있는 단서 = 0회, 일반 단서 = 1회).
   */
  cost?: number;
  /** 지정하면 '특수 단서' 탭에 노출된다 */
  special?: SpecialMeta;
  /** true면 잠긴 동안 구역 목록에서 아예 감춘다 (기본: 잠김 상태로 표시) */
  hiddenUntilUnlocked?: boolean;
}

export interface SpecialMeta {
  /** 특수 단서 탭의 섹션 구분 키 */
  category: string;
  /** 잠김 상태에서 대신 보여줄 이름. 예: "??? — 부검 정밀 결과" */
  lockedLabel: string;
  /** 잠김 상태에서 보여줄 뉘앙스. 예: "시신을 자세히 볼 방법이 필요하다" */
  lockedTeaser?: string;
}

/** 특수 단서 탭 섹션의 표시 순서와 라벨 */
export interface SpecialCategoryMeta {
  key: string;
  label: string;
  emoji?: string;
}

interface QuizQuestionBase {
  id: QuestionId;
  prompt: string;
  points: number;
  /** 채점 후 공개되는 해설 */
  explanation: string;
}

/** 범인 지목 — 선택지는 캐릭터 목록에서 자동 생성된다 */
export interface CulpritQuestion extends QuizQuestionBase {
  kind: 'culprit';
  answerCharacterId: CharacterId;
}

export interface QuizOption {
  id: string;
  text: string;
}

/** 단일 선택 */
export interface ChoiceQuestion extends QuizQuestionBase {
  kind: 'choice';
  options: QuizOption[];
  answerOptionId: string;
}

/** 복수 선택 */
export interface MultiQuestion extends QuizQuestionBase {
  kind: 'multi';
  options: QuizOption[];
  answerOptionIds: string[];
  /** true면 맞춘 개수 비례 부분점수, false/미지정이면 전부 맞아야 만점 */
  partialCredit?: boolean;
}

/** 서술형 — 키워드 포함 여부로 참고 채점 */
export interface TextQuestion extends QuizQuestionBase {
  kind: 'text';
  keywords: string[];
  /** 몇 개 이상 포함하면 만점인지. 미지정 시 전부 필요 */
  keywordsRequired?: number;
}

export type QuizQuestion =
  | CulpritQuestion
  | ChoiceQuestion
  | MultiQuestion
  | TextQuestion;
