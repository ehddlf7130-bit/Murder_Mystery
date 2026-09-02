import type { Area, ClueId, DeckMeta, Scenario } from '@/types/scenario';
import { areaProgress, type ClueState } from './clueRules';

/**
 * 맵의 층 구분. `Scenario.decks`가 없으면 층 없이 평평하게 다룬다.
 */

/** "4층 · 브리지 데크" */
export function deckLabel(deck: DeckMeta): string {
  return `${deck.level}층 · ${deck.name}`;
}

/** 구역이 속한 층. decks를 정의하지 않았거나 미배정이면 undefined */
export function deckOf(
  area: Area | undefined,
  scenario: Scenario,
): DeckMeta | undefined {
  if (!area?.deckId) return undefined;
  return scenario.decks?.find((d) => d.id === area.deckId);
}

export interface DeckSection {
  /** 층 미지정 구역을 모은 "기타" 섹션이면 null */
  deck: DeckMeta | null;
  areas: Area[];
  /** 이 층에 속한 구역들의 열람 진행도 합계 */
  progress: { viewed: number; total: number };
}

/**
 * 구역을 층별 섹션으로 묶는다. 층은 높은 곳부터(내림차순) 나열해
 * 배의 단면도처럼 보이게 한다.
 *
 * - `decks`가 없으면 섹션 하나(deck: null)에 전부 담아 기존 동작을 유지한다.
 * - 층이 없거나 존재하지 않는 층을 가리키는 구역은 맨 뒤 "기타" 섹션으로 모아
 *   화면에서 사라지지 않게 한다.
 */
export function groupAreasByDeck(
  scenario: Scenario,
  states: Map<ClueId, ClueState>,
): DeckSection[] {
  const sorted = [...scenario.areas].sort((a, b) => a.order - b.order);

  const sumProgress = (areas: Area[]) =>
    areas.reduce(
      (acc, area) => {
        const { viewed, total } = areaProgress(area.id, scenario, states);
        return { viewed: acc.viewed + viewed, total: acc.total + total };
      },
      { viewed: 0, total: 0 },
    );

  const decks = scenario.decks ?? [];
  if (decks.length === 0) {
    return [{ deck: null, areas: sorted, progress: sumProgress(sorted) }];
  }

  const known = new Set(decks.map((d) => d.id));
  const sections: DeckSection[] = [...decks]
    .sort((a, b) => b.level - a.level)
    .map((deck) => {
      const areas = sorted.filter((a) => a.deckId === deck.id);
      return { deck, areas, progress: sumProgress(areas) };
    })
    .filter((section) => section.areas.length > 0);

  const orphans = sorted.filter((a) => !a.deckId || !known.has(a.deckId));
  if (orphans.length > 0) {
    sections.push({
      deck: null,
      areas: orphans,
      progress: sumProgress(orphans),
    });
  }

  return sections;
}
