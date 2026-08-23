import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import type { QuizQuestion } from '@/types/scenario';
import { unansweredQuestions, type Answer } from '@/lib/scoring';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Panel } from '@/components/ui/Panel';
import { Screen } from '@/components/ui/Screen';
import { usePlayerStore, useScenarioPlayer } from '@/store/playerStore';
import { cn } from '@/lib/cn';
import { useScenario } from '../scenarioContext';

const optionClass = (selected: boolean) =>
  cn(
    'flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all',
    selected
      ? 'border-brass-400 bg-brass-500/10 text-fog-100'
      : 'border-ink-700 bg-ink-900/80 text-fog-200 hover:border-ink-500',
  );

const markerClass = (selected: boolean, round: boolean) =>
  cn(
    'flex size-5 shrink-0 items-center justify-center border text-xs',
    round ? 'rounded-full' : 'rounded',
    selected ? 'border-brass-400 bg-brass-500 text-ink-950' : 'border-ink-500',
  );

/** 게임 종료 후 최종 지목/답안 제출 */
export function Verdict() {
  const { characterId } = useParams();
  const scenario = useScenario();
  const player = useScenarioPlayer(scenario.id);
  const setAnswer = usePlayerStore((s) => s.setAnswer);
  const submit = usePlayerStore((s) => s.submit);
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);

  // 라우터의 상대 경로('..')는 URL 세그먼트가 아니라 라우트 계층을 올라간다.
  // player/:characterId/verdict는 한 개의 라우트라 '../result'가 엉뚱한 곳을 가리키므로
  // 화면 간 이동은 절대 경로로 만든다.
  const sheetPath = `/s/${scenario.id}/player/${characterId}`;
  const resultPath = `${sheetPath}/result`;

  // 답안은 기기 단위로 저장된다. URL의 캐릭터와 이 기기에 저장된 캐릭터가 다르면
  // 남의 이름 아래 내 답안을 보여주게 되므로 캐릭터 선택으로 돌려보낸다.
  if (player.characterId !== characterId) {
    return <Navigate to={`/s/${scenario.id}/player`} replace />;
  }

  // 이미 제출했다면 결과 화면이 정답 — 답안을 다시 고칠 수 없다.
  if (player.submittedAt !== null) return <Navigate to={resultPath} replace />;

  const answers = player.answers;
  const missing = unansweredQuestions(scenario, answers);

  const set = (questionId: string, value: Answer | undefined) =>
    setAnswer(scenario.id, questionId, value);

  const toggleMulti = (questionId: string, optionId: string) => {
    const current = answers[questionId];
    const list = Array.isArray(current) ? current : [];
    const next = list.includes(optionId)
      ? list.filter((id) => id !== optionId)
      : [...list, optionId];
    set(questionId, next.length > 0 ? next : undefined);
  };

  const finish = () => {
    submit(scenario.id);
    navigate(resultPath, { replace: true });
  };

  const renderQuestion = (question: QuizQuestion) => {
    const answer = answers[question.id];

    switch (question.kind) {
      case 'culprit':
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            {scenario.characters.map((character) => {
              const selected = answer === character.id;
              return (
                <button
                  key={character.id}
                  type="button"
                  onClick={() => set(question.id, character.id)}
                  className={optionClass(selected)}
                >
                  <span className={markerClass(selected, true)}>
                    {selected ? '✓' : ''}
                  </span>
                  <span aria-hidden className="text-xl">
                    {character.emoji ?? '🎭'}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold">{character.name}</span>
                    <span className="text-fog-400 block text-xs">
                      {character.job}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        );

      case 'choice':
        return (
          <div className="space-y-2">
            {question.options.map((option) => {
              const selected = answer === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => set(question.id, option.id)}
                  className={optionClass(selected)}
                >
                  <span className={markerClass(selected, true)}>
                    {selected ? '✓' : ''}
                  </span>
                  {option.text}
                </button>
              );
            })}
          </div>
        );

      case 'multi': {
        const list = Array.isArray(answer) ? answer : [];
        return (
          <div className="space-y-2">
            {question.options.map((option) => {
              const selected = list.includes(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleMulti(question.id, option.id)}
                  className={optionClass(selected)}
                >
                  <span className={markerClass(selected, false)}>
                    {selected ? '✓' : ''}
                  </span>
                  {option.text}
                </button>
              );
            })}
          </div>
        );
      }

      case 'text':
        return (
          <textarea
            value={typeof answer === 'string' ? answer : ''}
            onChange={(event) =>
              set(question.id, event.target.value || undefined)
            }
            rows={3}
            placeholder="한 문장으로 적어 주세요"
            className="border-ink-700 bg-ink-950 text-fog-100 placeholder:text-fog-400 focus:border-brass-500 w-full resize-none rounded-xl border px-4 py-3 outline-none transition-colors"
          />
        );
    }
  };

  return (
    <Screen
      back={sheetPath}
      backLabel="캐릭터 시트"
      width="narrow"
      eyebrow="최종 추리"
      title="당신의 답을 제출하세요"
      subtitle="제출하면 즉시 채점되고 정답과 해설이 공개됩니다. 한 번 제출하면 수정할 수 없습니다."
    >
      <div className="space-y-5">
        {scenario.quiz.map((question, index) => (
          <Panel key={question.id}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 className="text-fog-100 font-semibold">
                <span className="text-brass-500 mr-2 tabular-nums">
                  Q{index + 1}.
                </span>
                {question.prompt}
              </h2>
              <Badge tone="muted">{question.points}점</Badge>
            </div>
            {renderQuestion(question)}
          </Panel>
        ))}
      </div>

      <div className="border-ink-800 bg-ink-950/95 pb-safe fixed inset-x-0 bottom-0 border-t px-4 pt-3 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <span className="text-fog-400 text-xs">
            {missing.length === 0 ? (
              <span className="text-jade-400">모든 문항 응답 완료</span>
            ) : (
              `미응답 ${missing.length}문항`
            )}
          </span>
          <Button
            variant="primary"
            size="lg"
            className="ml-auto flex-1"
            onClick={() => setConfirming(true)}
          >
            제출하고 채점받기
          </Button>
        </div>
      </div>
      <div className="h-24" aria-hidden />

      <ConfirmDialog
        open={confirming}
        title="답안을 제출할까요?"
        confirmLabel="제출한다"
        cancelLabel="더 생각해본다"
        onConfirm={finish}
        onCancel={() => setConfirming(false)}
      >
        <p>제출하면 즉시 채점되고, 답안을 수정할 수 없습니다.</p>
        {missing.length > 0 && (
          <p className="border-crimson-500/40 bg-crimson-500/10 text-crimson-400 rounded-xl border px-4 py-3 text-sm">
            아직 답하지 않은 문항이 {missing.length}개 있습니다. 미응답은 0점으로
            처리됩니다.
          </p>
        )}
      </ConfirmDialog>
    </Screen>
  );
}
