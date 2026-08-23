import type { QuestionId, QuizQuestion, Scenario } from '@/types/scenario';

/**
 * 채점 로직. 제출된 답안은 그대로 보존하고 점수는 항상 여기서 다시 계산한다
 * (localStorage에 점수를 중복 저장하지 않으므로 배점을 고쳐도 결과가 어긋나지 않는다).
 */

/** 문항 유형별 답안 형태: culprit·choice·text는 문자열, multi는 문자열 배열 */
export type Answer = string | string[];
export type AnswerMap = Record<QuestionId, Answer | undefined>;

export type Correctness = 'correct' | 'partial' | 'wrong' | 'unanswered';

export interface QuestionResult {
  question: QuizQuestion;
  correctness: Correctness;
  earned: number;
  possible: number;
  /** 플레이어가 제출한 답안의 표시용 텍스트 */
  givenText: string;
  /** 정답의 표시용 텍스트 */
  answerText: string;
  /** true면 자동 채점이 참고용(서술형 키워드 매칭)임을 UI에서 알린다 */
  advisory: boolean;
}

export interface ScoreResult {
  score: number;
  maxScore: number;
  perQuestion: QuestionResult[];
}

function asStringAnswer(answer: Answer | undefined): string | undefined {
  if (typeof answer === 'string') {
    const trimmed = answer.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

function asArrayAnswer(answer: Answer | undefined): string[] | undefined {
  if (Array.isArray(answer)) {
    return answer.length > 0 ? answer : undefined;
  }
  return undefined;
}

/** 서술형 키워드 매칭용 정규화 — 공백/대소문자 차이를 무시한다 */
function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '');
}

function optionText(
  question: Extract<QuizQuestion, { options: unknown }>,
  optionId: string,
): string {
  return question.options.find((o) => o.id === optionId)?.text ?? optionId;
}

function characterName(scenario: Scenario, characterId: string): string {
  return (
    scenario.characters.find((c) => c.id === characterId)?.name ?? characterId
  );
}

function scoreQuestion(
  question: QuizQuestion,
  answer: Answer | undefined,
  scenario: Scenario,
): QuestionResult {
  const base = {
    question,
    possible: question.points,
    advisory: question.kind === 'text',
  };

  switch (question.kind) {
    case 'culprit': {
      const given = asStringAnswer(answer);
      const answerText = characterName(scenario, question.answerCharacterId);
      if (!given) {
        return {
          ...base,
          correctness: 'unanswered',
          earned: 0,
          givenText: '미응답',
          answerText,
        };
      }
      const correct = given === question.answerCharacterId;
      return {
        ...base,
        correctness: correct ? 'correct' : 'wrong',
        earned: correct ? question.points : 0,
        givenText: characterName(scenario, given),
        answerText,
      };
    }

    case 'choice': {
      const given = asStringAnswer(answer);
      const answerText = optionText(question, question.answerOptionId);
      if (!given) {
        return {
          ...base,
          correctness: 'unanswered',
          earned: 0,
          givenText: '미응답',
          answerText,
        };
      }
      const correct = given === question.answerOptionId;
      return {
        ...base,
        correctness: correct ? 'correct' : 'wrong',
        earned: correct ? question.points : 0,
        givenText: optionText(question, given),
        answerText,
      };
    }

    case 'multi': {
      const given = asArrayAnswer(answer);
      const answerText = question.answerOptionIds
        .map((id) => optionText(question, id))
        .join(', ');
      if (!given) {
        return {
          ...base,
          correctness: 'unanswered',
          earned: 0,
          givenText: '미응답',
          answerText,
        };
      }

      const expected = new Set(question.answerOptionIds);
      const picked = new Set(given);
      const hits = [...picked].filter((id) => expected.has(id)).length;
      const misses = picked.size - hits;
      const exact = hits === expected.size && misses === 0;

      let earned: number;
      if (exact) {
        earned = question.points;
      } else if (question.partialCredit) {
        // 오답 선택은 감점 — 전부 찍어서 부분점수를 얻는 것을 막는다.
        const ratio = Math.max(0, (hits - misses) / expected.size);
        earned = Math.round(question.points * ratio);
      } else {
        earned = 0;
      }

      const correctness: Correctness = exact
        ? 'correct'
        : earned > 0
          ? 'partial'
          : 'wrong';

      return {
        ...base,
        correctness,
        earned,
        givenText: given.map((id) => optionText(question, id)).join(', '),
        answerText,
      };
    }

    case 'text': {
      const given = asStringAnswer(answer);
      const answerText = `핵심 키워드: ${question.keywords.join(', ')}`;
      if (!given) {
        return {
          ...base,
          correctness: 'unanswered',
          earned: 0,
          givenText: '미응답',
          answerText,
        };
      }

      const haystack = normalize(given);
      const hits = question.keywords.filter((k) =>
        haystack.includes(normalize(k)),
      ).length;
      const required = Math.min(
        question.keywordsRequired ?? question.keywords.length,
        question.keywords.length,
      );

      let earned: number;
      let correctness: Correctness;
      if (required <= 0 || hits >= required) {
        earned = question.points;
        correctness = 'correct';
      } else if (hits > 0) {
        earned = Math.round((question.points * hits) / required);
        correctness = 'partial';
      } else {
        earned = 0;
        correctness = 'wrong';
      }

      return { ...base, correctness, earned, givenText: given, answerText };
    }
  }
}

export function scoreQuiz(scenario: Scenario, answers: AnswerMap): ScoreResult {
  const perQuestion = scenario.quiz.map((question) =>
    scoreQuestion(question, answers[question.id], scenario),
  );
  return {
    score: perQuestion.reduce((sum, r) => sum + r.earned, 0),
    maxScore: perQuestion.reduce((sum, r) => sum + r.possible, 0),
    perQuestion,
  };
}

/** 아직 답하지 않은 문항 ID — 제출 전 확인 다이얼로그에서 쓴다 */
export function unansweredQuestions(
  scenario: Scenario,
  answers: AnswerMap,
): QuizQuestion[] {
  return scenario.quiz.filter((q) => {
    const answer = answers[q.id];
    if (q.kind === 'multi') return asArrayAnswer(answer) === undefined;
    return asStringAnswer(answer) === undefined;
  });
}
