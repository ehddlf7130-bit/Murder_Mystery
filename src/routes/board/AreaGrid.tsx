import { Link } from 'react-router-dom';
import type { Area } from '@/types/scenario';
import { areaProgress } from '@/lib/clueRules';
import { deckLabel, groupAreasByDeck } from '@/lib/decks';
import { Badge } from '@/components/ui/Badge';
import { SectionTitle } from '@/components/ui/Panel';
import { useScenario } from '../scenarioContext';
import { useClueViewerContext } from './boardContext';

function AreaCard({ area, viewed, total }: { area: Area; viewed: number; total: number }) {
  const complete = total > 0 && viewed === total;

  return (
    <Link
      to={area.id}
      className="border-ink-700 bg-ink-900/80 hover:border-brass-500/70 hover:bg-ink-850 group flex flex-col gap-3 rounded-2xl border p-6 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <span aria-hidden className="text-3xl">
          {area.emoji ?? '📍'}
        </span>
        <Badge tone={complete ? 'jade' : viewed > 0 ? 'brass' : 'muted'}>
          {complete ? '✓ 조사 완료' : `열람 ${viewed}/${total}`}
        </Badge>
      </div>
      <h2 className="text-fog-100 group-hover:text-brass-300 text-lg font-bold transition-colors">
        {area.name}
      </h2>
      <p className="text-fog-400 line-clamp-2 text-sm">{area.description}</p>
    </Link>
  );
}

/** 맵 구역 목록 — 층이 정의된 시나리오는 높은 층부터 아래로 쌓아 보여준다 */
export function AreaGrid() {
  const scenario = useScenario();
  const { states } = useClueViewerContext();
  const sections = groupAreasByDeck(scenario, states);

  return (
    <>
      <p className="text-fog-300 mb-5">
        조사할 구역을 선택하세요. 구역 안의 단서를 처음 열람할 때 횟수가 차감됩니다.
      </p>

      <div className="space-y-8">
        {sections.map((section) => (
          <section key={section.deck?.id ?? '__other'}>
            {/* 층이 정의되지 않은 시나리오는 헤더 없이 기존처럼 한 덩어리로 나온다 */}
            {(section.deck !== null || sections.length > 1) && (
              <SectionTitle
                aside={
                  <Badge
                    tone={
                      section.progress.total > 0 &&
                      section.progress.viewed === section.progress.total
                        ? 'jade'
                        : section.progress.viewed > 0
                          ? 'brass'
                          : 'muted'
                    }
                  >
                    열람 {section.progress.viewed}/{section.progress.total}
                  </Badge>
                }
              >
                {section.deck ? deckLabel(section.deck) : '기타'}
                {section.deck?.note && (
                  <span className="text-fog-400 ml-2 font-normal tracking-normal normal-case">
                    {section.deck.note}
                  </span>
                )}
              </SectionTitle>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {section.areas.map((area) => {
                const { viewed, total } = areaProgress(area.id, scenario, states);
                return (
                  <AreaCard key={area.id} area={area} viewed={viewed} total={total} />
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
