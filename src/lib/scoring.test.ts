import { describe, expect, it } from 'vitest';
import type { QuizQuestion } from '@/types/scenario';
import { scoreQuiz, unansweredQuestions, type AnswerMap } from './scoring';
import { makeScenario } from './testScenario';

const quiz: QuizQuestion[] = [
  {
    kind: 'culprit',
    id: 'culprit',
    prompt: '범인은?',
    points: 40,
    answerCharacterId: 'suspect',
    explanation: '해설',
  },
  {
    kind: 'choice',
    id: 'method',
    prompt: '방법은?',
    points: 20,
    options: [
      { id: 'x', text: '독극물' },
      { id: 'y', text: '둔기' },
    ],
    answerOptionId: 'x',
    explanation: '해설',
  },
  {
    kind: 'multi',
    id: 'evidence',
    prompt: '근거는?',
    points: 20,
    partialCredit: true,
    options: [
      { id: 'p', text: '약병' },
      { id: 'q', text: '영상' },
      { id: 'r', text: '금고' },
      { id: 's', text: '잔' },
    ],
    answerOptionIds: ['p', 'q'],
    explanation: '해설',
  },
  {
    kind: 'text',
    id: 'motive',
    prompt: '동기는?',
    points: 20,
    keywords: ['가족', '복수'],
    keywordsRequired: 1,
    explanation: '해설',
  },
];

const scenario = makeScenario({ quiz });

const perfect: AnswerMap = {
  culprit: 'suspect',
  method: 'x',
  evidence: ['p', 'q'],
  motive: '가족을 잃었기 때문',
};

describe('scoreQuiz', () => {
  it('전부 정답이면 만점', () => {
    const result = scoreQuiz(scenario, perfect);
    expect(result.score).toBe(100);
    expect(result.maxScore).toBe(100);
    expect(result.perQuestion.every((r) => r.correctness === 'correct')).toBe(true);
  });

  it('전부 오답이면 0점', () => {
    const result = scoreQuiz(scenario, {
      culprit: 'nobody',
      method: 'y',
      evidence: ['r', 's'],
      motive: '돈 문제였다',
    });
    expect(result.score).toBe(0);
    expect(result.perQuestion.every((r) => r.correctness === 'wrong')).toBe(true);
  });

  it('미응답은 0점이고 unanswered로 표시된다', () => {
    const result = scoreQuiz(scenario, {});
    expect(result.score).toBe(0);
    expect(result.perQuestion.map((r) => r.correctness)).toEqual([
      'unanswered',
      'unanswered',
      'unanswered',
      'unanswered',
    ]);
    expect(result.perQuestion[0]!.givenText).toBe('미응답');
  });

  it('빈 문자열과 공백만 있는 서술형은 미응답으로 처리한다', () => {
    const result = scoreQuiz(scenario, { motive: '   ' });
    expect(result.perQuestion[3]!.correctness).toBe('unanswered');
  });

  it('복수 선택: 정답 하나만 고르면 부분점수', () => {
    const result = scoreQuiz(scenario, { ...perfect, evidence: ['p'] });
    // (맞은 1 - 틀린 0) / 정답 2 = 0.5 → 10점
    expect(result.perQuestion[2]!.earned).toBe(10);
    expect(result.perQuestion[2]!.correctness).toBe('partial');
  });

  it('복수 선택: 전부 찍으면 오답 감점으로 부분점수를 얻지 못한다', () => {
    const result = scoreQuiz(scenario, { ...perfect, evidence: ['p', 'q', 'r', 's'] });
    // (맞은 2 - 틀린 2) / 2 = 0 → 0점
    expect(result.perQuestion[2]!.earned).toBe(0);
    expect(result.perQuestion[2]!.correctness).toBe('wrong');
  });

  it('복수 선택: partialCredit이 없으면 전부 맞아야 점수를 준다', () => {
    const strict = makeScenario({
      quiz: [{ ...quiz[2], partialCredit: false } as QuizQuestion],
    });
    expect(scoreQuiz(strict, { evidence: ['p'] }).score).toBe(0);
    expect(scoreQuiz(strict, { evidence: ['p', 'q'] }).score).toBe(20);
  });

  it('서술형: 키워드가 하나만 있어도 required가 1이면 만점', () => {
    const result = scoreQuiz(scenario, { ...perfect, motive: '복수하려고' });
    expect(result.perQuestion[3]!.earned).toBe(20);
  });

  it('서술형: 공백·대소문자 차이를 무시하고 매칭한다', () => {
    const english = makeScenario({
      quiz: [
        {
          kind: 'text',
          id: 'motive',
          prompt: '동기는?',
          points: 10,
          keywords: ['Cover Up'],
          explanation: '해설',
        },
      ],
    });
    expect(scoreQuiz(english, { motive: 'a coverup attempt' }).score).toBe(10);
  });

  it('서술형은 참고 채점(advisory)으로 표시된다', () => {
    const result = scoreQuiz(scenario, perfect);
    expect(result.perQuestion[3]!.advisory).toBe(true);
    expect(result.perQuestion[0]!.advisory).toBe(false);
  });

  it('정답 표시 텍스트는 ID가 아니라 사람이 읽는 이름이다', () => {
    const result = scoreQuiz(scenario, perfect);
    expect(result.perQuestion[0]!.answerText).toBe('용의자');
    expect(result.perQuestion[1]!.answerText).toBe('독극물');
    expect(result.perQuestion[2]!.answerText).toBe('약병, 영상');
  });
});

describe('unansweredQuestions', () => {
  it('응답하지 않은 문항만 골라낸다', () => {
    expect(unansweredQuestions(scenario, perfect)).toHaveLength(0);
    expect(unansweredQuestions(scenario, { culprit: 'suspect' }).map((q) => q.id)).toEqual([
      'method',
      'evidence',
      'motive',
    ]);
  });

  it('빈 배열을 고른 복수 선택은 미응답이다', () => {
    expect(unansweredQuestions(scenario, { ...perfect, evidence: [] }).map((q) => q.id)).toEqual([
      'evidence',
    ]);
  });
});
