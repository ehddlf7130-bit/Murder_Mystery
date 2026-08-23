import { createContext, use } from 'react';
import type { Scenario } from '@/types/scenario';

export const ScenarioContext = createContext<Scenario | null>(null);

/** 현재 라우트의 시나리오. ScenarioLayout 아래에서만 호출한다 */
export function useScenario(): Scenario {
  const scenario = use(ScenarioContext);
  if (!scenario) {
    throw new Error('useScenario는 ScenarioLayout 안에서만 사용할 수 있습니다.');
  }
  return scenario;
}
