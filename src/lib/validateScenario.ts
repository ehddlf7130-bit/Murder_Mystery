import type { Clue, ClueId, Scenario } from '@/types/scenario';
import { clueCost, hintCost } from './clueRules';

/**
 * 시나리오 무결성 검사.
 *
 * 존재하지 않는 선행 단서 ID나 순환 참조 같은 오타가 현장에서
 * "단서가 영원히 열리지 않는다"로 터지는 것이 이 앱의 가장 현실적인 실패 모드다.
 * dev 모드 콘솔 경고 + 테스트로 이중 차단한다.
 */

export type IssueSeverity = 'error' | 'warning';

export interface ValidationIssue {
  severity: IssueSeverity;
  /** 문제가 있는 지점 (예: "clue:sp-autopsy") */
  where: string;
  message: string;
}

function findDuplicates(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) dupes.add(id);
    seen.add(id);
  }
  return [...dupes];
}

/**
 * 열람 가능성 판정: 선행조건 체인을 따라가 결국 열 수 있는 단서인지.
 * 순환에 걸리면 도달 불가로 표시된다.
 */
function findUnreachableClues(clues: readonly Clue[]): ClueId[] {
  const byId = new Map(clues.map((c) => [c.id, c]));
  const resolved = new Map<ClueId, boolean>();

  function reachable(id: ClueId, stack: Set<ClueId>): boolean {
    const cached = resolved.get(id);
    if (cached !== undefined) return cached;
    // 순환: 자기 자신을 선행조건으로 요구하는 체인
    if (stack.has(id)) return false;

    const clue = byId.get(id);
    if (!clue) return false;

    stack.add(id);
    const ok = clue.requires.every((req) => reachable(req, stack));
    stack.delete(id);

    resolved.set(id, ok);
    return ok;
  }

  return clues.filter((c) => !reachable(c.id, new Set())).map((c) => c.id);
}

export function validateScenario(scenario: Scenario): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const error = (where: string, message: string) =>
    issues.push({ severity: 'error', where, message });
  const warn = (where: string, message: string) =>
    issues.push({ severity: 'warning', where, message });

  const clueIds = new Set(scenario.clues.map((c) => c.id));
  const areaIds = new Set(scenario.areas.map((a) => a.id));
  const characterIds = new Set(scenario.characters.map((c) => c.id));

  // ── 중복 ID ──
  for (const [label, ids] of [
    ['clue', scenario.clues.map((c) => c.id)],
    ['area', scenario.areas.map((a) => a.id)],
    ['deck', (scenario.decks ?? []).map((d) => d.id)],
    ['character', scenario.characters.map((c) => c.id)],
    ['question', scenario.quiz.map((q) => q.id)],
  ] as const) {
    for (const dupe of findDuplicates(ids)) {
      error(`${label}:${dupe}`, `${label} ID가 중복됩니다.`);
    }
  }

  // ── 단서 ──
  for (const clue of scenario.clues) {
    const where = `clue:${clue.id}`;

    if (clue.location.kind === 'area' && !areaIds.has(clue.location.areaId)) {
      error(where, `존재하지 않는 구역을 가리킵니다: ${clue.location.areaId}`);
    }
    if (
      clue.location.kind === 'belonging' &&
      !characterIds.has(clue.location.characterId)
    ) {
      error(
        where,
        `존재하지 않는 인물의 소지품입니다: ${clue.location.characterId}`,
      );
    }

    for (const req of clue.requires) {
      if (req === clue.id) {
        error(where, '자기 자신을 선행조건으로 지정했습니다.');
      } else if (!clueIds.has(req)) {
        error(where, `존재하지 않는 선행 단서를 가리킵니다: ${req}`);
      }
    }
    if (new Set(clue.requires).size !== clue.requires.length) {
      warn(where, '선행조건에 중복된 ID가 있습니다.');
    }

    if (clueCost(clue) < 0) {
      error(where, '열람 비용이 음수입니다.');
    }
    if (hintCost(clue) < 0) {
      error(where, '힌트 비용이 음수입니다.');
    }
    if (!clue.hint && clue.hintCost !== undefined) {
      warn(where, '힌트가 없는데 힌트 비용만 지정되어 있습니다.');
    }
    if (!clue.special && clue.hiddenUntilUnlocked && clue.requires.length === 0) {
      warn(where, '선행조건 없이 hiddenUntilUnlocked라 영원히 보이지 않습니다.');
    }
    if (clue.body.trim().length === 0) {
      warn(where, '본문이 비어 있습니다.');
    }
  }

  if (!scenario.clues.some((c) => c.requires.length === 0)) {
    error(
      'scenario:clues',
      '선행조건 없는 진입 단서가 하나도 없어 게임을 시작할 수 없습니다.',
    );
  }

  for (const id of findUnreachableClues(scenario.clues)) {
    error(
      `clue:${id}`,
      '선행조건 순환 또는 끊긴 체인 때문에 절대 열람할 수 없습니다.',
    );
  }

  // ── 인물 ──
  const culprits = scenario.characters.filter((c) => c.isCulprit);
  if (culprits.length !== 1) {
    error(
      'scenario:characters',
      `범인(isCulprit)이 정확히 1명이어야 하는데 ${culprits.length}명입니다.`,
    );
  }

  // ── 구역 ──
  const decks = scenario.decks ?? [];
  const deckIds = new Set(decks.map((d) => d.id));

  for (const area of scenario.areas) {
    const hasClue = scenario.clues.some(
      (c) => c.location.kind === 'area' && c.location.areaId === area.id,
    );
    if (!hasClue) warn(`area:${area.id}`, '이 구역에 배치된 단서가 없습니다.');

    if (area.deckId !== undefined && !deckIds.has(area.deckId)) {
      error(`area:${area.id}`, `존재하지 않는 층을 가리킵니다: ${area.deckId}`);
    } else if (decks.length > 0 && area.deckId === undefined) {
      warn(
        `area:${area.id}`,
        '층이 지정되지 않아 맵에서 "기타" 섹션으로 빠집니다.',
      );
    }
  }

  // ── 층 ──
  for (const level of findDuplicates(decks.map((d) => String(d.level)))) {
    error('scenario:decks', `층수(level)가 중복됩니다: ${level}`);
  }
  for (const deck of decks) {
    const used = scenario.areas.some((a) => a.deckId === deck.id);
    if (!used) warn(`deck:${deck.id}`, '이 층에 속한 구역이 없습니다.');
  }

  // ── 문항 ──
  for (const question of scenario.quiz) {
    const where = `question:${question.id}`;
    if (question.points <= 0) warn(where, '배점이 0 이하입니다.');

    switch (question.kind) {
      case 'culprit':
        if (!characterIds.has(question.answerCharacterId)) {
          error(where, `존재하지 않는 인물을 정답으로 지정했습니다: ${question.answerCharacterId}`);
        } else if (
          !scenario.characters.find((c) => c.id === question.answerCharacterId)
            ?.isCulprit
        ) {
          error(where, '범인 지목 문항의 정답이 isCulprit 인물과 다릅니다.');
        }
        break;

      case 'choice': {
        const optionIds = new Set(question.options.map((o) => o.id));
        for (const dupe of findDuplicates(question.options.map((o) => o.id))) {
          error(where, `선택지 ID가 중복됩니다: ${dupe}`);
        }
        if (!optionIds.has(question.answerOptionId)) {
          error(where, `정답이 선택지에 없습니다: ${question.answerOptionId}`);
        }
        break;
      }

      case 'multi': {
        const optionIds = new Set(question.options.map((o) => o.id));
        for (const dupe of findDuplicates(question.options.map((o) => o.id))) {
          error(where, `선택지 ID가 중복됩니다: ${dupe}`);
        }
        if (question.answerOptionIds.length === 0) {
          error(where, '정답 선택지가 하나도 지정되지 않았습니다.');
        }
        for (const id of question.answerOptionIds) {
          if (!optionIds.has(id)) {
            error(where, `정답이 선택지에 없습니다: ${id}`);
          }
        }
        break;
      }

      case 'text':
        if (question.keywords.length === 0) {
          error(where, '서술형 채점 키워드가 비어 있습니다.');
        }
        if (
          question.keywordsRequired !== undefined &&
          (question.keywordsRequired <= 0 ||
            question.keywordsRequired > question.keywords.length)
        ) {
          error(
            where,
            `keywordsRequired가 범위를 벗어났습니다: ${question.keywordsRequired}`,
          );
        }
        break;
    }
  }

  if (scenario.quiz.length === 0) {
    error('scenario:quiz', '채점 문항이 없습니다.');
  }

  // ── 밸런스 ──
  if (scenario.totalInvestigations <= 0) {
    error('scenario:totalInvestigations', '총 열람 횟수가 0 이하입니다.');
  } else {
    const payableClues = scenario.clues.filter((c) => clueCost(c) > 0);
    const fullCost = payableClues.reduce((sum, c) => sum + clueCost(c), 0);
    if (scenario.totalInvestigations >= fullCost) {
      warn(
        'scenario:totalInvestigations',
        `총 ${scenario.totalInvestigations}회로 유료 단서 전부(${fullCost}회)를 열 수 있어 예산 압박이 없습니다.`,
      );
    }
  }

  // 힌트 예산은 열람 예산과 별개다 — 같은 기준으로 따로 검사한다.
  if (scenario.totalHints < 0) {
    error('scenario:totalHints', '총 힌트 횟수가 음수입니다.');
  } else {
    const hinted = scenario.clues.filter((c) => c.hint);
    const fullHintCost = hinted.reduce((sum, c) => sum + hintCost(c), 0);
    if (hinted.length > 0 && scenario.totalHints === 0) {
      warn(
        'scenario:totalHints',
        `힌트가 ${hinted.length}개 있지만 힌트 예산이 0이라 아무도 볼 수 없습니다.`,
      );
    } else if (scenario.totalHints > 0 && scenario.totalHints >= fullHintCost) {
      warn(
        'scenario:totalHints',
        `총 ${scenario.totalHints}회로 유료 힌트 전부(${fullHintCost}회)를 볼 수 있어 선택의 여지가 없습니다.`,
      );
    }
  }

  return issues;
}

/** dev 모드 진입 시 1회 호출해 콘솔에 리포트한다 */
export function reportScenarioIssues(scenarios: readonly Scenario[]): void {
  for (const scenario of scenarios) {
    const issues = validateScenario(scenario);
    if (issues.length === 0) continue;

    const errors = issues.filter((i) => i.severity === 'error');
    const label = `[시나리오 검사] ${scenario.title} — 오류 ${errors.length} / 경고 ${issues.length - errors.length}`;

    console.groupCollapsed(label);
    for (const issue of issues) {
      const line = `${issue.where} — ${issue.message}`;
      if (issue.severity === 'error') console.error(line);
      else console.warn(line);
    }
    console.groupEnd();
  }
}
