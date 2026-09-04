import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { Screen } from '@/components/ui/Screen';
import { usePlayerStore, useScenarioPlayer } from '@/store/playerStore';
import { cn } from '@/lib/cn';
import { useScenario } from '../scenarioContext';

type Tab = 'story' | 'goals' | 'public';

const tabLabels: Record<Tab, string> = {
  story: '배경',
  goals: '목표',
  public: '공개 정보',
};

/** 내 캐릭터 시트 — 배경, 개인 목표, 공개 프로필 */
export function CharacterSheet() {
  const { characterId } = useParams();
  const scenario = useScenario();
  const player = useScenarioPlayer(scenario.id);
  const selectCharacter = usePlayerStore((s) => s.selectCharacter);
  const toggleGoal = usePlayerStore((s) => s.toggleGoal);
  const [tab, setTab] = useState<Tab>('story');

  const character = scenario.characters.find((c) => c.id === characterId);

  // URL을 기준으로 삼는다 — 링크를 직접 열었더라도 저장된 선택과 일치시킨다.
  // (같은 캐릭터면 no-op, 다른 캐릭터면 목표·답안이 초기화된다)
  useEffect(() => {
    if (character) selectCharacter(scenario.id, character.id);
  }, [character, scenario.id, selectCharacter]);

  if (!character) return <Navigate to=".." relative="path" replace />;

  const submitted = player.submittedAt !== null;
  const doneGoals = new Set(player.completedGoalIds);

  return (
    <Screen
      back=".."
      backLabel="캐릭터 선택"
      width="narrow"
      eyebrow={character.job}
      title={
        <span className="flex items-center gap-3">
          <span aria-hidden>{character.emoji ?? '🎭'}</span>
          {character.name}
        </span>
      }
    >
      <div
        role="tablist"
        aria-label="캐릭터 시트 탭"
        className="border-ink-700 mb-5 flex gap-1 border-b"
      >
        {(Object.keys(tabLabels) as Tab[]).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              '-mb-px flex-1 border-b-2 px-3 py-3 text-sm font-medium transition-colors',
              tab === key
                ? 'border-brass-400 text-brass-300'
                : 'text-fog-400 hover:text-fog-200 border-transparent',
            )}
          >
            {tabLabels[key]}
            {key === 'goals' && (
              <span className="text-fog-400 ml-1.5 text-xs tabular-nums">
                {doneGoals.size}/{character.goals.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'story' && (
        <div className="space-y-4">
          <Panel>
            <p className="text-fog-100 leading-relaxed whitespace-pre-line">
              {character.backstory}
            </p>
          </Panel>
          {character.secrets && character.secrets.length > 0 && (
            <Panel className="border-crimson-500/40 bg-crimson-500/5">
              <p className="text-crimson-400 mb-2 text-xs font-semibold tracking-widest uppercase">
                🤫 나만 아는 사실
              </p>
              <ul className="text-fog-200 space-y-2 text-sm">
                {character.secrets.map((secret) => (
                  <li key={secret}>· {secret}</li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      )}

      {tab === 'goals' && (
        <div className="space-y-3">
          {scenario.sharedGoals && scenario.sharedGoals.length > 0 && (
            <Panel className="border-brass-600/50 bg-brass-500/5">
              <p className="text-brass-300 mb-2 text-xs font-semibold tracking-widest uppercase">
                🤝 공동 목표
              </p>
              <ul className="text-fog-100 space-y-2 text-sm leading-relaxed">
                {scenario.sharedGoals.map((goal) => (
                  <li key={goal}>· {goal}</li>
                ))}
              </ul>
              <p className="text-fog-400 mt-3 text-xs">
                이 배에 탄 모두에게 주어진 목표입니다.
              </p>
            </Panel>
          )}

          <p className="text-fog-400 pt-2 text-xs font-semibold tracking-widest uppercase">
            개인 목표
          </p>
          <p className="text-fog-400 text-sm">
            목표를 달성했다고 생각하면 체크해 두세요. 점수와는 무관한 개인 메모입니다.
          </p>
          {character.goals.map((goal) => {
            const done = doneGoals.has(goal.id);
            return (
              <button
                key={goal.id}
                type="button"
                onClick={() => toggleGoal(scenario.id, goal.id)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all',
                  done
                    ? 'border-jade-500/50 bg-jade-500/10'
                    : 'border-ink-700 bg-ink-900/80 hover:border-ink-500',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border text-xs',
                    done
                      ? 'border-jade-400 bg-jade-500 text-ink-950'
                      : 'border-ink-500',
                  )}
                >
                  {done ? '✓' : ''}
                </span>
                <span
                  className={cn(
                    'text-sm leading-relaxed',
                    done ? 'text-fog-300 line-through' : 'text-fog-100',
                  )}
                >
                  {goal.text}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {tab === 'public' && (
        <Panel>
          <p className="text-fog-400 mb-2 text-xs font-semibold tracking-widest uppercase">
            다른 사람들도 아는 정보
          </p>
          <p className="text-fog-100 leading-relaxed">{character.publicProfile}</p>
        </Panel>
      )}

      <div className="border-ink-800 bg-ink-950/95 pb-safe fixed inset-x-0 bottom-0 border-t px-4 pt-3 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          {submitted ? (
            <>
              <Badge tone="jade">제출 완료</Badge>
              <Link to="result" className="flex-1">
                <Button variant="primary" size="lg" className="w-full">
                  결과 보기
                </Button>
              </Link>
            </>
          ) : (
            <Link to="verdict" className="flex-1">
              <Button variant="primary" size="lg" className="w-full">
                🔎 채점 제출하기
              </Button>
            </Link>
          )}
        </div>
      </div>
      {/* 고정 액션 바에 내용이 가리지 않도록 여백 확보 */}
      <div className="h-24" aria-hidden />
    </Screen>
  );
}
