import type { Scenario } from '@/types/scenario';
import { areas } from './areas';
import { characters } from './characters';
import { clues, specialCategories } from './clues';
import { quiz } from './quiz';

export const cruiseScenario: Scenario = {
  id: 'cruise',
  title: '호화 크루즈 살인사건',
  tagline: '항구까지 여섯 시간. 배 위에 범인이 있다.',
  playerCount: '4~5인',
  playtime: '30~60분',
  synopsis:
    '(더미) 태평양 항로를 달리는 호화 크루즈 오르카호. 항해 3일차 아침, ' +
    '선주이자 그룹 회장인 백도훤이 최상층 VIP 객실에서 숨진 채 발견되었다. ' +
    '다음 항구까지는 여섯 시간. 그때까지 이 배에서 내릴 수 있는 사람은 없다.',
  // 더미 데이터 기준: 유료 단서 8개 중 6개만 볼 수 있어 선택의 압박이 생긴다.
  // (특수 단서 4개를 모두 해제하는 최소 경로가 정확히 6회 — 대신 다른 단서는 포기해야 한다)
  // 실제 시나리오 텍스트를 채운 뒤 리허설로 다시 조정할 값.
  totalInvestigations: 6,
  characters,
  areas,
  clues,
  specialCategories,
  quiz,
  epilogue:
    '(더미) 모든 것은 7년 전 그 사고에서 시작되었다. ' +
    '정하람은 회장의 이름을 잊은 적이 없었고, 이 배의 승무원 모집 공고를 본 순간 결심했다.',
};
