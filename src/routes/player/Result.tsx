import { useMemo } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import type { Correctness, QuestionResult } from '@/lib/scoring';
import { scoreQuiz } from '@/lib/scoring';
import { Badge } from '@/components/ui/Badge';
import { Panel, SectionTitle } from '@/components/ui/Panel';
import { Screen } from '@/components/ui/Screen';
import { useScenarioPlayer } from '@/store/playerStore';
import { cn } from '@/lib/cn';
import { useScenario } from '../scenarioContext';

const marks: Record<Correctness, { icon: string; label: string; tone: 'jade' | 'brass' | 'crimson' | 'muted' }> = {
  correct: { icon: '✓', label: '정답', tone: 'jade' },
  partial: { icon: '△', label: '부분 정답', tone: 'brass' },
  wrong: { icon: '✕', label: '오답', tone: 'crimson' },
  unanswered: { icon: '—', label: '미응답', tone: 'muted' },
};

/** 점수 비율에 따른 칭호 */
function rankLabel(ratio: number): string {
  if (ratio >= 1) return '완전무결한 진실';
  if (ratio >= 0.8) return '명탐정';
  if (ratio >= 0.6) return '유능한 조사관';
  if (ratio >= 0.4) return '아슬아슬한 추리';
  if (ratio > 0) return '사건은 미궁으로';
  return '범인은 웃고 있다';
}

function QuestionRow({ result }: { result: QuestionResult }) {
  const mark = marks[result.correctness];

  return (
    <Panel
      className={cn(
        result.correctness === 'correct' && 'border-jade-500/40',
        result.correctness === 'wrong' && 'border-crimson-500/30',
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-fog-100 font-semibold">{result.question.prompt}</h3>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Badge tone={mark.tone}>
            {mark.icon} {mark.label}
          </Badge>
          <span className="text-fog-400 text-xs tabular-nums">
            {result.earned} / {result.possible}점
          </span>
        </div>
      </div>

      <dl className="mb-3 space-y-1.5 text-sm">
        <div className="flex gap-2">
          <dt className="text-fog-400 w-16 shrink-0">내 답안</dt>
          <dd className="text-fog-200">{result.givenText}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-fog-400 w-16 shrink-0">정답</dt>
          <dd className="text-brass-300">{result.answerText}</dd>
        </div>
      </dl>

      <p className="border-ink-700 bg-ink-850 text-fog-200 rounded-xl border px-4 py-3 text-sm leading-relaxed">
        {result.question.explanation}
      </p>

      {result.advisory && (
        <p className="text-fog-400 mt-2 text-xs">
          ※ 서술형은 키워드 자동 채점이라 참고용입니다. 최종 판단은 심판이 합니다.
        </p>
      )}
    </Panel>
  );
}

/** 채점 결과 + 정답 해설 + 에필로그 */
export function Result() {
  const { characterId } = useParams();
  const scenario = useScenario();
  const player = useScenarioPlayer(scenario.id);

  // 점수는 저장하지 않고 제출된 답안으로 매번 다시 계산한다.
  const result = useMemo(
    () => scoreQuiz(scenario, player.answers),
    [scenario, player.answers],
  );

  // 상대 경로는 라우트 계층 기준이라 이 위치에서 '..'가 의도와 다르게 풀린다 — 절대 경로 사용.
  const sheetPath = `/s/${scenario.id}/player/${characterId}`;

  // 저장된 답안은 이 기기의 캐릭터 것이다 — URL이 다른 캐릭터를 가리키면 보여주지 않는다.
  if (player.characterId !== characterId) {
    return <Navigate to={`/s/${scenario.id}/player`} replace />;
  }

  if (player.submittedAt === null) {
    return <Navigate to={`${sheetPath}/verdict`} replace />;
  }

  const ratio = result.maxScore === 0 ? 0 : result.score / result.maxScore;

  return (
    <Screen
      back={sheetPath}
      backLabel="캐릭터 시트"
      width="narrow"
      eyebrow="채점 결과"
      title={rankLabel(ratio)}
    >
      <Panel className="border-brass-600/50 bg-brass-500/5 mb-6 text-center">
        <p className="text-fog-400 text-xs font-semibold tracking-widest uppercase">
          최종 점수
        </p>
        <p className="mt-1 flex items-baseline justify-center gap-1">
          <span className="text-brass-300 text-6xl font-bold tabular-nums">
            {result.score}
          </span>
          <span className="text-fog-400 text-2xl">/ {result.maxScore}</span>
        </p>
        <div className="bg-ink-800 mt-4 h-2 overflow-hidden rounded-full">
          <div
            className="bg-brass-500 h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.round(ratio * 100)}%` }}
          />
        </div>
      </Panel>

      <SectionTitle>문항별 결과</SectionTitle>
      <div className="mb-8 space-y-3">
        {result.perQuestion.map((questionResult) => (
          <QuestionRow key={questionResult.question.id} result={questionResult} />
        ))}
      </div>

      <SectionTitle>사건의 진상</SectionTitle>
      <Panel className="border-ink-600">
        <p className="text-fog-100 leading-relaxed whitespace-pre-line">
          {scenario.epilogue}
        </p>
      </Panel>

      <p className="text-fog-400 mt-8 text-center text-xs">
        답안을 다시 제출해야 한다면 심판에게 요청하세요.
      </p>
    </Screen>
  );
}
