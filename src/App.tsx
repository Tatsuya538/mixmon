import { useEffect } from 'react';
import { HashRouter, MemoryRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useGame } from './store/gameStore';
import { BottomNav } from './ui/components/BottomNav';
import { Overlays } from './ui/components/Overlays';
import { Dex } from './ui/screens/Dex';
import { Exchange } from './ui/screens/Exchange';
import { Gacha } from './ui/screens/Gacha';
import { GachaRates } from './ui/screens/GachaRates';
import { Home } from './ui/screens/Home';
import { MonsterList } from './ui/screens/MonsterList';
import { ParentSelect } from './ui/screens/ParentSelect';
import { Synthesis } from './ui/screens/Synthesis';
import { SynthesisResult } from './ui/screens/SynthesisResult';

/** Artifact 内では URL のハッシュを使えないため、画面遷移をメモリ上で管理する */
const Router = import.meta.env.MODE === 'artifact' ? MemoryRouter : HashRouter;

/** 下部ナビを隠す画面 */
const HIDE_NAV = ['/synthesis/result'];

function Shell() {
  const { pathname } = useLocation();
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/synthesis" element={<Synthesis />} />
        <Route path="/synthesis/select/:slot" element={<ParentSelect />} />
        <Route path="/synthesis/result" element={<SynthesisResult />} />
        <Route path="/gacha" element={<Gacha />} />
        <Route path="/gacha/rates" element={<GachaRates />} />
        <Route path="/dex" element={<Dex />} />
        <Route path="/exchange" element={<Exchange />} />
        <Route path="/monsters" element={<MonsterList />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!HIDE_NAV.includes(pathname) && <BottomNav />}
      <Overlays />
    </div>
  );
}

export function App() {
  const status = useGame((s) => s.status);
  const error = useGame((s) => s.error);
  const load = useGame((s) => s.load);

  useEffect(() => {
    load();
  }, [load]);

  if (status === 'loading') return <div className="app splash">読み込み中…</div>;
  if (status === 'error')
    return (
      <div className="app splash">
        データの読み込みに失敗しました
        <small>{error}</small>
      </div>
    );
  return (
    <Router>
      <Shell />
    </Router>
  );
}
