import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { catalog } from '../../data';
import { getMonster } from '../../domain/catalog';
import type { Acquired } from '../../domain/game';
import {
  adRemaining,
  freeRemaining,
  GACHA_RATES,
  GACHA_SHINY_RATE,
  MULTI_COUNT,
  type GachaKind,
} from '../../domain/gacha';
import { services } from '../../services';
import { PRODUCT_GACHA10 } from '../../services/PurchaseService';
import { deps, useGame } from '../../store/gameStore';
import { RankBadge, ShinyBadge } from '../components/Badges';
import { ConfirmModal, Modal } from '../components/Modal';
import { MonsterArt } from '../components/MonsterArt';
import { PageHeader } from '../components/PageHeader';
import { PointsPill } from '../components/PointsPill';
import { percent } from '../format';
import { useUi } from '../uiStore';
import './Gacha.css';

function GachaMachine({ spinning }: { spinning: boolean }) {
  const balls = [
    ['#ff7a45', 84, 92],
    ['#4ea3ff', 138, 70],
    ['#ffd84a', 170, 118],
    ['#9a7bff', 68, 140],
    ['#6fd46f', 112, 132],
    ['#ffd24a', 152, 160],
  ] as const;
  return (
    <svg viewBox="0 0 240 240" className={`machine${spinning ? ' spinning' : ''}`} aria-hidden>
      <circle cx="120" cy="112" r="80" fill="#3b3370" stroke="#6a5fb8" strokeWidth="5" />
      {balls.map(([color, x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="17" fill={color} />
          <circle cx={x - 6} cy={y - 6} r="4.5" fill="#fff" />
        </g>
      ))}
      <rect x="60" y="168" width="120" height="72" rx="12" fill="#f2b33d" />
      <circle cx="120" cy="196" r="17" fill="#1b1633" />
      <rect x="109" y="193" width="22" height="6" rx="3" fill="#f2b33d" />
      <rect x="102" y="222" width="36" height="10" rx="4" fill="#1b1633" />
    </svg>
  );
}

function ResultModal({ results, onClose }: { results: Acquired[]; onClose: () => void }) {
  const single = results.length === 1;
  return (
    <Modal onClose={onClose}>
      <h2>{single ? 'ガチャ結果' : `${results.length}連ガチャ結果`}</h2>
      <div className={single ? 'gacha-single' : 'mon-grid'}>
        {results.map(({ monster: o, newNormal, newShiny }) => {
          const m = getMonster(catalog, o.monsterId);
          return (
            <div key={o.uid} className={`gacha-result${o.shiny ? ' shiny' : ''}`}>
              {(newNormal || newShiny) && <span className="new-tag">NEW</span>}
              <MonsterArt monster={m} shiny={o.shiny} size={single ? 140 : 52} />
              <span className="name">{m.name}</span>
              <span className="meta">
                <RankBadge rank={m.rank} />
                {o.shiny && <ShinyBadge />}
              </span>
            </div>
          );
        })}
      </div>
      <button className="btn btn-primary" onClick={onClose}>
        OK
      </button>
    </Modal>
  );
}

export function Gacha() {
  const game = useGame((s) => s.game)!;
  const { run, watchAd } = useUi();
  const busy = useUi((s) => s.busy);
  const [results, setResults] = useState<Acquired[]>();
  const [spinning, setSpinning] = useState(false);
  const [priceLabel, setPriceLabel] = useState('');
  const [confirmPaid, setConfirmPaid] = useState(false);

  useEffect(() => {
    services.purchases
      .getProducts()
      .then((ps) => setPriceLabel(ps.find((p) => p.id === PRODUCT_GACHA10)?.priceLabel ?? ''));
  }, []);

  const now = deps.now();
  const free = freeRemaining(game.player.daily, now);
  const ad = adRemaining(game.player.daily, now);

  const spin = (kind: GachaKind) =>
    run(async () => {
      if (kind === 'ad' && !(await watchAd('gacha'))) return;
      if (kind === 'paid10' && !(await services.purchases.purchase(PRODUCT_GACHA10))) return;
      setSpinning(true);
      await new Promise((r) => setTimeout(r, 700));
      try {
        setResults(await useGame.getState().gacha(kind));
      } finally {
        setSpinning(false);
      }
    });

  return (
    <div className="page gacha">
      <PageHeader title="ガチャ" right={<PointsPill />} />

      <div className="card machine-card">
        <GachaMachine spinning={spinning} />
      </div>

      <button className="btn btn-primary btn-row" disabled={free === 0 || busy} onClick={() => spin('free')}>
        無料で回す<small>今日あと{free}回</small>
      </button>
      <button className="btn btn-outline btn-row" disabled={ad === 0 || busy} onClick={() => spin('ad')}>
        広告を見て回す<small>残り{ad}回</small>
      </button>
      <button className="btn btn-purple btn-row" disabled={busy} onClick={() => setConfirmPaid(true)}>
        {MULTI_COUNT}連ガチャ<small>{priceLabel}</small>
      </button>

      <section className="card rates">
        <div className="rates-head">
          <span>排出率</span>
          <Link to="/gacha/rates" className="link">
            詳細を見る
          </Link>
        </div>
        <div className="rates-row">
          {GACHA_RATES.map((g) => (
            <div key={g.rank}>
              <span className="text-sub">{g.rank}</span>
              <b>{percent(g.rate)}</b>
            </div>
          ))}
          <div>
            <span className="text-sub">色違い</span>
            <b className="shiny-text">{percent(GACHA_SHINY_RATE)}</b>
          </div>
        </div>
      </section>

      <div className="gacha-foot">
        <span className="text-sub">ダブったモンスターは交換所でptに</span>
        <Link to="/exchange" className="link">
          交換所へ
        </Link>
      </div>

      {confirmPaid && (
        <ConfirmModal
          title={`${MULTI_COUNT}連ガチャを購入しますか？`}
          message={`${priceLabel}（モックのため実際の課金は発生しません）`}
          okLabel="購入する"
          onOk={() => {
            setConfirmPaid(false);
            spin('paid10');
          }}
          onCancel={() => setConfirmPaid(false)}
        />
      )}
      {results && <ResultModal results={results} onClose={() => setResults(undefined)} />}
    </div>
  );
}
