import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { listScenarios } from './data';
import { reportScenarioIssues } from './lib/validateScenario';
import './index.css';

// 시나리오 데이터 오타(끊긴 선행조건, 순환 참조 등)를 개발 중에 바로 알아차리도록.
if (import.meta.env.DEV) {
  reportScenarioIssues(listScenarios());
}

const container = document.getElementById('root');
if (!container) throw new Error('#root 엘리먼트를 찾을 수 없습니다.');

createRoot(container).render(
  <StrictMode>
    {/* GitHub Pages에 SPA fallback이 없으므로 해시 라우팅을 쓴다 */}
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
