import type { Scenario, ScenarioId } from '@/types/scenario';
import { cruiseScenario } from './cruise';

/**
 * 시나리오 레지스트리.
 * 새 시나리오를 추가하려면 `src/data/<id>/`를 만들고 여기에 한 줄 등록한다.
 */
const registry: Scenario[] = [cruiseScenario];

export function listScenarios(): Scenario[] {
  return registry;
}

export function getScenario(id: ScenarioId | undefined): Scenario | undefined {
  if (!id) return undefined;
  return registry.find((s) => s.id === id);
}
