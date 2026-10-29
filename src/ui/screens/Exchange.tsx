import { useState } from 'react';
import { catalog } from '../../data';
import {
  exchangePrice,
  exchangeTargets,
  needsSellConfirm,
  selectDuplicates,
  sellPrice,
  totalSellPrice,
} from '../../domain/exchange';
import { elementText } from '../../domain/labels';
import type { Element, Monster } from '../../domain/types';
import { useGame } from '../../store/gameStore';
import { RankBadge } from '../components/Badges';
import { ConfirmModal } from '../components/Modal';
import { MonsterArt } from '../components/MonsterArt';
import { ElementFilter, MonsterGridWithFilter } from '../components/MonsterGridWithFilter';
import { PageHeader } from '../components/PageHeader';
import { PointsPill } from '../components/PointsPill';
import { useUi } from '../uiStore';
import './Exchange.css';

type Tab = 'sell' | 'buy';

function SellTab() {
  const game = useGame((s) => s.game)!;
  const { run, showToast } = useUi();
  const [selected, setSelected] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);

  const sellable = game.monsters.filter((o) => sellPrice(catalog, o) !== null);
  const items = sellable.filter((o) => selected.includes(o.uid));
  const total = totalSellPrice(catalog, items);
  const valuable = items.filter(needsSellConfirm).length;

  const toggle = (uid: string) => setSelected((s) => (s.includes(uid) ? s.filter((x) => x !== uid) : [...s, uid]));

  const onSell = () =>
    run(async () => {
      setConfirming(false);
      const gained = await useGame.getState().sell(items.map((o) => o.uid));
      setSelected([]);
      showToast(`${gained}pt を手に入れた！`);
    });

  return (
    <>
      <p className="exchange-note text-sub">N=1pt・R=5ptで売却できます（SR以上は売却不可）</p>
      <div className="sell-tools">
        <button className="btn btn-outline" onClick={() => setSelected(selectDuplicates(catalog, sellable))}>
          ダブりを一括選択
        </button>
        <button className="btn btn-outline" disabled={selected.length === 0} onClick={() => setSelected([])}>
          選択解除
        </button>
      </div>
      <MonsterGridWithFilter
        monsters={sellable}
        isSelected={(o) => selected.includes(o.uid)}
        onPick={(o) => toggle(o.uid)}
        emptyText="売却できるモンスターがいません"
      />
      <div className="sell-bar">
        <span>
          {items.length}体選択 <b className="plus">+{total}pt</b>
        </span>
        <button className="btn btn-primary" disabled={items.length === 0} onClick={() => setConfirming(true)}>
          売却する
        </button>
      </div>
      {confirming && (
        <ConfirmModal
          title={`${items.length}体を売却しますか？`}
          message={
            <>
              {total}pt を獲得します。売却したモンスターは戻りません。
              {valuable > 0 && (
                <>
                  <br />
                  <b className="warn">色違い・＋5以上の個体が{valuable}体含まれています</b>
                </>
              )}
            </>
          }
          okLabel="売却"
          onOk={onSell}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  );
}

function BuyTab() {
  const game = useGame((s) => s.game)!;
  const { run, showToast } = useUi();
  const [target, setTarget] = useState<Monster>();
  const [el, setEl] = useState<Element | 'all'>('all');
  const points = game.player.points;

  const onExchange = (m: Monster) =>
    run(async () => {
      setTarget(undefined);
      const r = await useGame.getState().exchange(m.id);
      showToast(`${m.name} を手に入れた！${r.newNormal ? '（図鑑登録）' : ''}`);
    });

  return (
    <>
      <p className="exchange-note text-sub">ptを使って好きなモンスターと交換できます（N=10pt・R=50pt）</p>
      <ElementFilter value={el} onChange={setEl} />
      <ul className="buy-list">
        {exchangeTargets(catalog)
          .filter((m) => el === 'all' || m.element === el)
          .map((m) => {
            const price = exchangePrice(catalog, m.id);
            const count = game.monsters.filter((o) => o.monsterId === m.id).length;
            return (
              <li key={m.id} className="buy-item">
                <MonsterArt monster={m} size={52} />
                <div className="buy-info">
                  <span className="buy-name">{m.name}</span>
                  <span className="buy-meta">
                    <RankBadge rank={m.rank} />
                    <span className="text-sub">{elementText(m)}</span>
                    <span className="text-dim">所持{count}</span>
                  </span>
                </div>
                <button className="buy-btn" disabled={points < price} onClick={() => setTarget(m)}>
                  {price}pt
                </button>
              </li>
            );
          })}
      </ul>
      {target && (
        <ConfirmModal
          title={`${target.name} と交換しますか？`}
          message={`${exchangePrice(catalog, target.id)}pt を使います（所持 ${points}pt）`}
          okLabel="交換"
          onOk={() => onExchange(target)}
          onCancel={() => setTarget(undefined)}
        />
      )}
    </>
  );
}

export function Exchange() {
  const [tab, setTab] = useState<Tab>('sell');
  return (
    <div className="page exchange">
      <PageHeader title="交換所" right={<PointsPill />} />
      <div className="segment" role="group" aria-label="交換所メニュー">
        <button aria-pressed={tab === 'sell'} onClick={() => setTab('sell')}>
          売却してpt化
        </button>
        <button aria-pressed={tab === 'buy'} onClick={() => setTab('buy')}>
          指名交換
        </button>
      </div>
      {tab === 'sell' ? <SellTab /> : <BuyTab />}
    </div>
  );
}
