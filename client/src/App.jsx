import { Routes, Route } from "react-router-dom";

import PlayersPage from "./pages/PlayersPage";
import CreateMatchPage from "./pages/CreateMatchPage";
import ScorePage from "./pages/ScorePage";
import MatchPage from "./pages/MatchPage";
import HomePage from "./pages/HomePage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route path="/match/:id" element={<MatchPage />} />

      <Route path="/admin/players" element={<PlayersPage />} />

      <Route path="/admin/matches/create" element={<CreateMatchPage />} />

      <Route path="/admin/match/:id/score" element={<ScorePage />} />
    </Routes>
  );
}
