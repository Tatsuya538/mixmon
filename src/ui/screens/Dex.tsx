import { useState } from 'react';
import { catalog } from '../../data';
import { dexHint, dexProgress } from '../../domain/dex';
import { elementText } from '../../domain/labels';
import type { Element, Monster } from '../../domain/types';
import { useGame } from '../../store/gameStore';
import { RankBadge } from '../components/Badges';
import { SparkleIcon } from '../components/Icons';
import { Modal } from '../components/Modal';
import { MonsterArt } from '../components/MonsterArt';
import { StatBoxes } from '../components/MonsterDetail';
import { ElementFilter, matchesElement } from '../components/MonsterGridWithFilter';
import { PageHeader } from '../components/PageHeader';
import { useUi } from '../uiStore';
import './Dex.css';

type Tab = 'normal' | 'shiny';
const TOTAL = catalog.monsters.length;
const no = (m: Monster) => `No.${String(m.no).padStart(3, '0')}`;

export function Dex() {
  const game = useGame((s) => s.game)!;
  const revealed = useGame((s) => s.revealedDexHints);
  const { watchAd, run } = useUi();
  const [tab, setTab] = useState<Tab>('normal');
  const [el, setEl] = useState<Element | 'all'>('all');
  const [openId, setOpenId] = useState<string>();

  const dex = game.player.dex;
  const progress = dexProgress(dex);
  const found = (m: Monster) => (tab === 'normal' ? !!dex[m.id]?.normal : !!dex[m.id]?.shiny);
  const list = catalog.monsters.filter((m) => matchesElement(m.id, el));
  const open = openId ? catalog.byId.get(openId) : undefined;
  const ownedCount = open
    ? game.monsters.filter((o) => o.monsterId === open.id && o.shiny === (tab === 'shiny')).length
    : 0;

  const onHint = (id: string) =>
    run(async () => {
      if (await watchAd('dexHint')) useGame.getState().revealDexHint(id);
    });

  return (
    <div className="page dex">
      <PageHeader
        title="図鑑"
        right={
          <span className="dex-total">
            {tab === 'normal' ? progress.normal : progress.shiny}
            <small> / {TOTAL}</small>
          </span>
        }
      />
      <div className="segment" role="group" aria-label="図鑑の種類">
        <button aria-pressed={tab === 'normal'} onClick={() => setTab('normal')}>
          通常 {progress.normal}/{TOTAL}
        </button>
        <button aria-pressed={tab === 'shiny'} onClick={() => setTab('shiny')}>
          色違い {progress.shiny}/{TOTAL}
        </button>
      </div>
      <ElementFilter value={el} onChange={setEl} />

      <div className="mon-grid">
        {list.map((m) => {
          const f = found(m);
          return (
            <button key={m.id} className="mon-tile dex-tile" onClick={() => setOpenId(m.id)}>
              <span className="no">{no(m)}</span>
              {tab === 'normal' && dex[m.id]?.shiny && (
                <span className="corner" aria-label="色違い発見済み">
                  <SparkleIcon />
                </span>
              )}
              <MonsterArt monster={m} shiny={tab === 'shiny'} silhouette={!f} sparkles={false} size={52} />
              <span className={`name${f ? '' : ' unknown'}`}>{f ? m.name : '？？？'}</span>
            </button>
          );
        })}
      </div>
      <p className="dex-foot text-sub">？？？をタップすると合成のヒントが見られます</p>

      {open && (
        <Modal onClose={() => setOpenId(undefined)}>
          {found(open) ? (
            <>
              <div className="dex-detail-art">
                <MonsterArt monster={open} shiny={tab === 'shiny'} size={140} />
              </div>
              <h2>
                {tab === 'shiny' ? '色違い ' : ''}
                {open.name}
              </h2>
              <div className="dex-detail-meta">
                <span className="text-sub">{no(open)}</span>
                <RankBadge rank={open.rank} />
                <span className="el-chip">{elementText(open)}</span>
              </div>
              <StatBoxes monsterId={open.id} />
              <p>所持数：{ownedCount}体</p>
            </>
          ) : (
            <>
              <div className="dex-detail-art">
                <MonsterArt monster={open} silhouette size={140} />
              </div>
              <h2>
                {no(open)} ？？？{tab === 'shiny' ? '（色違い）' : ''}
              </h2>
              {tab === 'shiny' && dex[open.id]?.normal ? (
                <p>色違いの親から合成すると、確実に色違いが生まれます</p>
              ) : revealed.includes(open.id) ? (
                <p className="dex-hint">{dexHint(catalog, open.id)}</p>
              ) : (
                <>
                  <p>広告を見ると、誕生のヒントが分かります</p>
                  <button className="btn btn-outline" onClick={() => onHint(open.id)}>
                    広告を見てヒントを見る
                  </button>
                </>
              )}
            </>
          )}
          <button className="btn btn-primary" onClick={() => setOpenId(undefined)}>
            閉じる
          </button>
        </Modal>
      )}
    </div>
  );
}
