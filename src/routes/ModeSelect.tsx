import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Panel } from '@/components/ui/Panel';
import { Screen } from '@/components/ui/Screen';
import { useScenario } from './scenarioContext';

function ModeCard({
  to,
  icon,
  title,
  device,
  description,
  accent,
}: {
  to: string;
  icon: string;
  title: string;
  device: string;
  description: string;
  accent: boolean;
}) {
  return (
    <Link
      to={to}
      className={
        accent
          ? 'border-brass-600/60 bg-brass-500/5 hover:border-brass-400 hover:bg-brass-500/10 flex flex-col items-center gap-3 rounded-2xl border-2 p-8 text-center transition-all'
          : 'border-ink-600 bg-ink-900/80 hover:border-ink-500 hover:bg-ink-850 flex flex-col items-center gap-3 rounded-2xl border-2 p-8 text-center transition-all'
      }
    >
      <span aria-hidden className="text-5xl">
        {icon}
      </span>
      <span className="text-fog-100 text-xl font-bold">{title}</span>
      <Badge tone={accent ? 'brass' : 'neutral'}>{device}</Badge>
      <span className="text-fog-300 text-sm">{description}</span>
    </Link>
  );
}

/** 2단계: 개인용 / 게임 진행용 갈래 */
export function ModeSelect() {
  const scenario = useScenario();

  return (
    <Screen
      back="/"
      backLabel="시나리오 선택"
      eyebrow={`${scenario.playerCount} · ${scenario.playtime}`}
      title={scenario.title}
    >
      <Panel className="mb-8">
        <p className="text-fog-200 leading-relaxed whitespace-pre-line">
          {scenario.synopsis}
        </p>
      </Panel>

      <h2 className="text-fog-300 mb-4 text-center text-sm font-semibold tracking-widest uppercase">
        이 기기를 무엇으로 사용하나요?
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <ModeCard
          to="player"
          icon="📱"
          title="개인용"
          device="각자의 휴대폰"
          description="내 캐릭터의 배경과 개인 목표를 확인하고, 마지막에 채점을 제출합니다."
          accent={false}
        />
        <ModeCard
          to="board"
          icon="💻"
          title="게임 진행용"
          device="공용 노트북 1대"
          description="맵을 조사하고 단서를 열람합니다. 남은 열람 횟수를 함께 관리합니다."
          accent
        />
      </div>

      <div className="border-ink-700 bg-ink-900/60 text-fog-400 mt-8 rounded-2xl border border-dashed px-5 py-4 text-sm">
        <p>
          ⚠️ <strong className="text-fog-200">진행 화면은 공용 노트북 1대에서만</strong>{' '}
          열어 주세요. 열람 횟수는 각 기기에 따로 저장되므로, 두 대에서 열면 횟수가
          따로 세어집니다.
        </p>
      </div>

      <div className="mt-8 text-center">
        <Link
          to="gm"
          className="text-fog-400 hover:text-brass-300 text-xs underline underline-offset-4 transition-colors"
        >
          심판용 패널
        </Link>
      </div>
    </Screen>
  );
}
