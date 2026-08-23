import { Navigate, Route, Routes } from 'react-router-dom';
import { ScenarioLayout } from './routes/ScenarioLayout';
import { ScenarioSelect } from './routes/ScenarioSelect';
import { ModeSelect } from './routes/ModeSelect';
import { CharacterSelect } from './routes/player/CharacterSelect';
import { CharacterSheet } from './routes/player/CharacterSheet';
import { Verdict } from './routes/player/Verdict';
import { Result } from './routes/player/Result';
import { BoardLayout } from './routes/board/BoardLayout';
import { AreaGrid } from './routes/board/AreaGrid';
import { AreaDetail } from './routes/board/AreaDetail';
import { SpecialClues } from './routes/board/SpecialClues';
import { ViewedLog } from './routes/board/ViewedLog';
import { GmPanel } from './routes/gm/GmPanel';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ScenarioSelect />} />

      <Route path="/s/:scenarioId" element={<ScenarioLayout />}>
        <Route index element={<ModeSelect />} />

        {/* 개인 모바일 */}
        <Route path="player" element={<CharacterSelect />} />
        <Route path="player/:characterId" element={<CharacterSheet />} />
        <Route path="player/:characterId/verdict" element={<Verdict />} />
        <Route path="player/:characterId/result" element={<Result />} />

        {/* 공용 노트북 */}
        <Route path="board" element={<BoardLayout />}>
          <Route index element={<Navigate to="map" replace />} />
          <Route path="map" element={<AreaGrid />} />
          <Route path="map/:areaId" element={<AreaDetail />} />
          <Route path="special" element={<SpecialClues />} />
          <Route path="log" element={<ViewedLog />} />
        </Route>

        {/* 심판 */}
        <Route path="gm" element={<GmPanel />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
