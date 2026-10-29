import { Link, useNavigate } from 'react-router-dom';
import { catalog } from '../../data';
import { getMonster } from '../../domain/catalog';
import { dexProgress } from '../../domain/dex';
import { adRemaining, freeRemaining } from '../../domain/gacha';
import { elementText } from '../../domain/labels';
import { deps, useGame } from '../../store/gameStore';
import { Plus, RankBadge, ShinyBadge } from '../components/Badges';
import { GachaIcon } from '../components/Icons';
import { MonsterArt } from '../components/MonsterArt';
import { PointsPill } from '../components/PointsPill';
import './Home.css';

const TOTAL = catalog.monsters.length;

export function Home() {
  const navigate = useNavigate();
  const game = useGame((s) => s.game)!;
  const volatile = useGame((s) => s.volatile);
  const progress = dexProgress(game.player.dex);
  const now = deps.now();
  const free = freeRemaining(game.player.daily, now);
  const ad = adRemaining(game.player.daily, now);
  const recent = game.monsters
    .filter((m) => m.origin === 'synthesis')
    .sort((a, b) => b.obtainedAt - a.obtainedAt)
    .slice(0, 3);

  return (
    <div className="page home">
      <header className="page-header">
        <h1 className="logo">ミクスモン</h1>
        <PointsPill />
      </header>

      {volatile && (
        <p className="volatile-note">この環境ではデータが保存されません（再読み込みで最初からになります）</p>
      )}

      <section className="card dex-card">
        <div className="dex-card-top">
          <span className="text-sub">図鑑達成率</span>
          <span className="big-count">
            {progress.normal}
            <small> / {TOTAL}</small>
          </span>
        </div>
        <div className="bar" role="progressbar" aria-valuenow={progress.normal} aria-valuemax={TOTAL}>
          <div style={{ width: `${(progress.normal / TOTAL) * 100}%` }} />
        </div>
        <div className="text-sub dex-card-sub">
          <span>
            色違い {progress.shiny} / {TOTAL}
          </span>
          <span>
            特殊合成 {game.player.discoveredRecipes.length} / {catalog.recipes.length}
          </span>
        </div>
      </section>

      <button className="gacha-banner" onClick={() => navigate('/gacha')}>
        <GachaIcon strokeWidth={2} />
        <span className="gacha-banner-text">
          <b>{free > 0 ? `無料ガチャ あと${free}回` : '無料ガチャ また明日'}</b>
          <small>{ad > 0 ? `広告を見ると${free > 0 ? 'さらに' : 'あと'}${ad}回` : 'また明日回せます'}</small>
        </span>
        <span className="gacha-banner-btn">回す</span>
      </button>

      <div className="section-title">
        <span>最近生まれたモンスター</span>
        <Link to="/dex" className="link">
          図鑑へ
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="empty">
          まだ合成したモンスターがいません
          <br />
          <Link to="/synthesis" className="link">
            合成してみよう
          </Link>
        </div>
      ) : (
        <ul className="recent-list">
          {recent.map((o) => {
            const m = getMonster(catalog, o.monsterId);
            return (
              <li key={o.uid} className="recent-item">
                <div className="recent-art">
                  <MonsterArt monster={m} shiny={o.shiny} sparkles={false} size={56} />
                </div>
                <div className="recent-info">
                  <div className="recent-name">
                    {m.name} <Plus value={o.plus} />
                  </div>
                  <div className="recent-meta">
                    <RankBadge rank={m.rank} />
                    <span className="text-sub">{elementText(m)}</span>
                    {o.shiny && <ShinyBadge />}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Link to="/monsters" className="btn btn-outline">
        所持モンスター一覧（{game.monsters.length}体）
      </Link>
    </div>
  );
}
