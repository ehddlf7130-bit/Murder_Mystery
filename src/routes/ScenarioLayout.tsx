import { Navigate, Outlet, useParams } from 'react-router-dom';
import { getScenario } from '@/data';
import { ScenarioContext } from './scenarioContext';

/**
 * :scenarioId를 한 번만 검증하고 하위 라우트 전체에 시나리오를 공급한다.
 * 존재하지 않는 ID면 시작 화면으로 돌려보낸다.
 */
export function ScenarioLayout() {
  const { scenarioId } = useParams();
  const scenario = getScenario(scenarioId);

  if (!scenario) return <Navigate to="/" replace />;

  return (
    <ScenarioContext.Provider value={scenario}>
      <Outlet />
    </ScenarioContext.Provider>
  );
}
