import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Screen } from '@/components/ui/Screen';
import { usePlayerStore, useScenarioPlayer } from '@/store/playerStore';
import { cn } from '@/lib/cn';
import { useScenario } from '../scenarioContext';

/** 3-A단계: 내 캐릭터 선택 */
export function CharacterSelect() {
  const scenario = useScenario();
  const player = useScenarioPlayer(scenario.id);
  const selectCharacter = usePlayerStore((s) => s.selectCharacter);
  const navigate = useNavigate();

  const choose = (characterId: string) => {
    selectCharacter(scenario.id, characterId);
    navigate(characterId);
  };

  return (
    <Screen
      back=".."
      backLabel="모드 선택"
      width="narrow"
      eyebrow="개인용 화면"
      title="당신은 누구입니까?"
      subtitle="심판이 배정한 캐릭터를 선택하세요."
    >
      <div className="space-y-3">
        {scenario.characters.map((character) => {
          const mine = player.characterId === character.id;
          return (
            <button
              key={character.id}
              type="button"
              onClick={() => choose(character.id)}
              className={cn(
                'flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition-all',
                mine
                  ? 'border-brass-400 bg-brass-500/10'
                  : 'border-ink-700 bg-ink-900/80 hover:border-ink-500 hover:bg-ink-850',
              )}
            >
              <span aria-hidden className="text-3xl">
                {character.emoji ?? '🎭'}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-fog-100 text-lg font-bold">
                    {character.name}
                  </span>
                  <Badge tone={mine ? 'brass' : 'muted'}>{character.job}</Badge>
                  {mine && <Badge tone="brass">내 캐릭터</Badge>}
                </span>
                <span className="text-fog-300 mt-1.5 block text-sm">
                  {character.publicProfile}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-fog-400 mt-6 text-center text-xs">
        다른 사람의 캐릭터는 열어 보지 말아 주세요. 재미가 사라집니다.
      </p>
    </Screen>
  );
}
