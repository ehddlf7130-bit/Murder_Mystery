import { useMemo, useState } from 'react';
import type { QuizQuestion } from '@/types/scenario';
import {
  buildClueStates,
  locationLabel,
  remainingInvestigations,
  totalInvestigations,
  type ClueState,
} from '@/lib/clueRules';
import { validateScenario } from '@/lib/validateScenario';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Panel, SectionTitle } from '@/components/ui/Panel';
import { Screen } from '@/components/ui/Screen';
import { useProgressStore, useScenarioProgress } from '@/store/progressStore';
import { usePlayerStore, useScenarioPlayer } from '@/store/playerStore';
import { cn } from '@/lib/cn';
import { useScenario } from '../scenarioContext';

const statusBadge: Record<
  ClueState['status'],
  { label: string; tone: 'jade' | 'brass' | 'crimson' | 'muted' }
> = {
  viewed: { label: '열람됨', tone: 'jade' },
  available: { label: '열람 가능', tone: 'brass' },
  insufficient: { label: '횟수 부족', tone: 'crimson' },
  locked: { label: '잠김', tone: 'muted' },
};

function answerKeyText(question: QuizQuestion, characterName: (id: string) => string): string {
  switch (question.kind) {
    case 'culprit':
      return characterName(question.answerCharacterId);
    case 'choice':
      return (
        question.options.find((o) => o.id === question.answerOptionId)?.text ??
        question.answerOptionId
      );
    case 'multi':
      return question.answerOptionIds
        .map((id) => question.options.find((o) => o.id === id)?.text ?? id)
        .join(' + ');
    case 'text':
      return `키워드: ${question.keywords.join(', ')}`;
  }
}

/**
 * 심판 패널.
 * 진행이 막혔을 때 현장에서 손쓸 수 있는 수단을 모아 둔다.
 * ⚠️ 정답 키가 그대로 보이므로 플레이어에게 화면을 보여주지 않는다.
 */
export function GmPanel() {
  const scenario = useScenario();
  const progress = useScenarioProgress(scenario.id);
  const player = useScenarioPlayer(scenario.id);

  const adjustInvestigations = useProgressStore((s) => s.adjustInvestigations);
  const setForceUnlocked = useProgressStore((s) => s.setForceUnlocked);
  const setViewed = useProgressStore((s) => s.setViewed);
  const resetScenario = useProgressStore((s) => s.resetScenario);
  const reopenSubmission = usePlayerStore((s) => s.reopenSubmission);
  const resetPlayer = usePlayerStore((s) => s.resetPlayer);

  /** 0: 닫힘, 1: 1차 확인, 2: 2차 확인 — 실수로 진행을 날리는 것을 막는다 */
  const [resetStage, setResetStage] = useState(0);
  const [showAnswers, setShowAnswers] = useState(false);

  const states = useMemo(
    () => buildClueStates(scenario, progress),
    [scenario, progress],
  );
  const issues = useMemo(() => validateScenario(scenario), [scenario]);

  const total = totalInvestigations(scenario, progress);
  const remaining = remainingInvestigations(scenario, progress);
  const viewedCount = progress.viewedClueIds.length;
  const characterName = (id: string) =>
    scenario.characters.find((c) => c.id === id)?.name ?? id;
  const culprit = scenario.characters.find((c) => c.isCulprit);

  return (
    <Screen
      back=".."
      backLabel="모드 선택"
      eyebrow="심판 전용"
      title="진행 관리 패널"
      subtitle="이 화면은 플레이어에게 보여주지 마세요. 정답이 그대로 표시됩니다."
    >
      {/* ── 현황 ── */}
      <div className="mb-8 grid gap-3 sm:grid-cols-4">
        {[
          { label: '남은 횟수', value: `${remaining}`, sub: `/ ${total}` },
          { label: '열람한 단서', value: `${viewedCount}`, sub: `/ ${scenario.clues.length}` },
          {
            label: '횟수 조정',
            value: `${progress.bonusInvestigations >= 0 ? '+' : ''}${progress.bonusInvestigations}`,
            sub: '',
          },
          {
            label: '강제 해제',
            value: `${progress.gmUnlockedClueIds.length}`,
            sub: '건',
          },
        ].map((stat) => (
          <Panel key={stat.label} className="py-4 text-center">
            <p className="text-fog-400 text-[11px] font-semibold tracking-widest uppercase">
              {stat.label}
            </p>
            <p className="text-fog-100 mt-1 text-3xl font-bold tabular-nums">
              {stat.value}
              {stat.sub && (
                <span className="text-fog-400 ml-1 text-base font-normal">
                  {stat.sub}
                </span>
              )}
            </p>
          </Panel>
        ))}
      </div>

      {/* ── 횟수 조정 ── */}
      <section className="mb-8">
        <SectionTitle>열람 횟수 조정</SectionTitle>
        <Panel>
          <div className="flex flex-wrap items-center gap-2">
            {[-5, -1, +1, +5].map((delta) => (
              <Button
                key={delta}
                onClick={() => adjustInvestigations(scenario.id, delta)}
              >
                {delta > 0 ? `+${delta}` : delta}
              </Button>
            ))}
            <p className="text-fog-400 ml-2 text-sm">
              기본 {scenario.totalInvestigations}회 + 조정{' '}
              {progress.bonusInvestigations}회 ={' '}
              <strong className="text-fog-100">{total}회</strong>
            </p>
          </div>
        </Panel>
      </section>

      {/* ── 단서 관리 ── */}
      <section className="mb-8">
        <SectionTitle
          aside={
            <span className="text-fog-400 text-xs">
              막힌 조를 진행시킬 때만 사용하세요
            </span>
          }
        >
          단서 상태 관리
        </SectionTitle>
        <div className="space-y-2">
          {scenario.clues.map((clue) => {
            const state = states.get(clue.id);
            if (!state) return null;
            const badge = statusBadge[state.status];
            const isViewed = state.status === 'viewed';

            return (
              <div
                key={clue.id}
                className="border-ink-700 bg-ink-900/60 flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-fog-100 flex flex-wrap items-center gap-2 font-medium">
                    {clue.name}
                    {clue.special && <Badge tone="brass">✦ 특수</Badge>}
                    <Badge tone={badge.tone}>{badge.label}</Badge>
                  </p>
                  <p className="text-fog-400 mt-0.5 text-xs">
                    📍 {locationLabel(clue.location, scenario)} · 비용 {state.cost}회
                    {clue.requires.length > 0 && (
                      <> · 선행 {clue.requires.length}개</>
                    )}
                    {state.unmetRequires.length > 0 && (
                      <span className="text-crimson-400">
                        {' '}
                        (미충족 {state.unmetRequires.length}: {state.unmetRequires.map((c) => c.name).join(', ')})
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  {clue.requires.length > 0 && (
                    <Button
                      size="sm"
                      variant={state.gmUnlocked ? 'primary' : 'secondary'}
                      onClick={() =>
                        setForceUnlocked(scenario.id, clue.id, !state.gmUnlocked)
                      }
                    >
                      {state.gmUnlocked ? '강제 해제 취소' : '강제 해제'}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={isViewed ? 'primary' : 'secondary'}
                    onClick={() =>
                      setViewed(scenario.id, clue.id, !isViewed, {
                        charge: state.cost,
                      })
                    }
                  >
                    {isViewed ? '열람 취소' : '열람 처리'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 정답 키 ── */}
      <section className="mb-8">
        <SectionTitle
          aside={
            <Button size="sm" onClick={() => setShowAnswers((v) => !v)}>
              {showAnswers ? '가리기' : '정답 보기'}
            </Button>
          }
        >
          정답 키
        </SectionTitle>
        <Panel className={cn(!showAnswers && 'select-none')}>
          {showAnswers ? (
            <div className="space-y-4">
              <p className="text-crimson-400 font-semibold">
                🔪 범인: {culprit ? `${culprit.name} (${culprit.job})` : '미지정'}
              </p>
              <ol className="space-y-3">
                {scenario.quiz.map((question, index) => (
                  <li key={question.id} className="text-sm">
                    <p className="text-fog-200">
                      <span className="text-brass-500 mr-1.5 font-semibold tabular-nums">
                        Q{index + 1}
                      </span>
                      {question.prompt}{' '}
                      <span className="text-fog-400">({question.points}점)</span>
                    </p>
                    <p className="text-brass-300 mt-0.5">
                      → {answerKeyText(question, characterName)}
                    </p>
                  </li>
                ))}
              </ol>
              <p className="border-ink-700 text-fog-300 border-t pt-3 text-sm whitespace-pre-line">
                {scenario.epilogue}
              </p>
            </div>
          ) : (
            <p className="text-fog-400 text-sm">
              정답과 에필로그가 숨겨져 있습니다. 주변에 플레이어가 없을 때 열어
              보세요.
            </p>
          )}
        </Panel>
      </section>

      {/* ── 개인 기기 ── */}
      <section className="mb-8">
        <SectionTitle>이 기기의 개인 데이터</SectionTitle>
        <Panel>
          <p className="text-fog-300 mb-3 text-sm">
            개인 화면 상태는 각 플레이어의 휴대폰에 따로 저장됩니다. 아래 버튼은{' '}
            <strong className="text-fog-100">지금 보고 있는 이 기기</strong>에만
            적용됩니다.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => reopenSubmission(scenario.id)}
              disabled={player.submittedAt === null}
            >
              재제출 허용
            </Button>
            <Button onClick={() => resetPlayer(scenario.id)}>
              개인 데이터 초기화
            </Button>
            <span className="text-fog-400 text-xs">
              {player.characterId
                ? `선택된 캐릭터: ${characterName(player.characterId)}${
                    player.submittedAt !== null ? ' · 제출 완료' : ''
                  }`
                : '이 기기에서 선택된 캐릭터 없음'}
            </span>
          </div>
        </Panel>
      </section>

      {/* ── 데이터 검사 ── */}
      {issues.length > 0 && (
        <section className="mb-8">
          <SectionTitle>시나리오 데이터 검사</SectionTitle>
          <Panel>
            <ul className="space-y-1.5 text-sm">
              {issues.map((issue) => (
                <li
                  key={`${issue.severity}${issue.where}${issue.message}`}
                  className={
                    issue.severity === 'error'
                      ? 'text-crimson-400'
                      : 'text-fog-400'
                  }
                >
                  {issue.severity === 'error' ? '⛔' : '⚠️'}{' '}
                  <code className="text-xs">{issue.where}</code> — {issue.message}
                </li>
              ))}
            </ul>
          </Panel>
        </section>
      )}

      {/* ── 초기화 ── */}
      <section>
        <SectionTitle>게임 초기화</SectionTitle>
        <Panel className="border-crimson-500/40">
          <p className="text-fog-300 mb-3 text-sm">
            열람한 단서, 남은 횟수, 강제 해제 기록을 모두 지웁니다. 다음 조가 플레이를
            시작하기 전에 실행하세요. 개인 기기의 캐릭터 선택은 영향받지 않습니다.
          </p>
          <Button variant="danger" onClick={() => setResetStage(1)}>
            진행 상태 초기화
          </Button>
        </Panel>
      </section>

      <ConfirmDialog
        open={resetStage === 1}
        title="진행 상태를 초기화할까요?"
        tone="danger"
        confirmLabel="계속"
        onConfirm={() => setResetStage(2)}
        onCancel={() => setResetStage(0)}
      >
        <p>
          현재 열람한 단서 <strong>{viewedCount}건</strong>과 남은 횟수{' '}
          <strong>{remaining}회</strong>가 모두 사라집니다.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={resetStage === 2}
        title="정말 초기화합니다"
        tone="danger"
        confirmLabel="완전히 초기화"
        cancelLabel="아니요, 그만둡니다"
        onConfirm={() => {
          resetScenario(scenario.id);
          setResetStage(0);
        }}
        onCancel={() => setResetStage(0)}
      >
        <p className="text-crimson-400 font-semibold">
          이 작업은 되돌릴 수 없습니다. 게임이 진행 중이라면 지금 멈추세요.
        </p>
      </ConfirmDialog>
    </Screen>
  );
}
