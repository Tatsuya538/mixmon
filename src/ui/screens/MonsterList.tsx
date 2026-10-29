import { useState } from 'react';
import { catalog } from '../../data';
import { getMonster } from '../../domain/catalog';
import type { OwnedMonster } from '../../domain/types';
import { useGame } from '../../store/gameStore';
import { Modal } from '../components/Modal';
import { MonsterArt } from '../components/MonsterArt';
import { LineageCard, RankLine, StatBoxes } from '../components/MonsterDetail';
import { MonsterGridWithFilter } from '../components/MonsterGridWithFilter';
import { PageHeader } from '../components/PageHeader';

export function MonsterList() {
  const game = useGame((s) => s.game)!;
  const [open, setOpen] = useState<OwnedMonster>();
  const m = open && getMonster(catalog, open.monsterId);
  return (
    <div className="page">
      <PageHeader back title="所持モンスター" right={<span className="pill">{game.monsters.length}体</span>} />
      <MonsterGridWithFilter monsters={game.monsters} onPick={setOpen} />
      {open && m && (
        <Modal onClose={() => setOpen(undefined)}>
          <div style={{ display: 'grid', placeItems: 'center' }}>
            <MonsterArt monster={m} shiny={open.shiny} size={140} />
          </div>
          <h2>
            {open.shiny ? '色違い ' : ''}
            {m.name}
          </h2>
          <RankLine owned={open} />
          <StatBoxes monsterId={m.id} />
          <LineageCard owned={open} />
          <button className="btn btn-primary" onClick={() => setOpen(undefined)}>
            閉じる
          </button>
        </Modal>
      )}
    </div>
  );
}
