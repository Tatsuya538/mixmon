import { useState } from 'react';
import { catalog } from '../../data';
import { getMonster } from '../../domain/catalog';
import { ELEMENT_LABEL, RANK_ORDER } from '../../domain/labels';
import { ELEMENTS, type Element, type OwnedMonster } from '../../domain/types';
import { MonsterTile } from './MonsterTile';

type Sort = 'new' | 'rank' | 'plus';
const SORT_LABEL: Record<Sort, string> = { new: '新しい順', rank: 'ランク順', plus: '＋値順' };

export function ElementFilter({ value, onChange }: { value: Element | 'all'; onChange: (v: Element | 'all') => void }) {
  return (
    <div className="chips" role="group" aria-label="属性で絞り込み">
      <button className="chip" aria-pressed={value === 'all'} onClick={() => onChange('all')}>
        すべて
      </button>
      {ELEMENTS.map((el) => (
        <button
          key={el}
          className="chip"
          aria-pressed={value === el}
          onClick={() => onChange(el)}
          style={value === el ? undefined : { color: `var(--el-${el})` }}
        >
          {ELEMENT_LABEL[el]}
        </button>
      ))}
    </div>
  );
}

export function matchesElement(monsterId: string, el: Element | 'all'): boolean {
  if (el === 'all') return true;
  const m = getMonster(catalog, monsterId);
  return m.element === el;
}

interface Props {
  monsters: OwnedMonster[];
  isSelected?: (o: OwnedMonster) => boolean;
  isDisabled?: (o: OwnedMonster) => boolean;
  onPick: (o: OwnedMonster) => void;
  emptyText?: string;
}

/** 属性絞り込み＋並べ替え付きの所持モンスター一覧 */
export function MonsterGridWithFilter({
  monsters,
  isSelected,
  isDisabled,
  onPick,
  emptyText = 'モンスターがいません',
}: Props) {
  const [el, setEl] = useState<Element | 'all'>('all');
  const [sort, setSort] = useState<Sort>('new');

  const list = monsters
    .filter((o) => matchesElement(o.monsterId, el))
    .sort((a, b) => {
      if (sort === 'rank') {
        const d = RANK_ORDER[getMonster(catalog, b.monsterId).rank] - RANK_ORDER[getMonster(catalog, a.monsterId).rank];
        if (d) return d;
      }
      if (sort === 'plus' && b.plus !== a.plus) return b.plus - a.plus;
      return b.obtainedAt - a.obtainedAt || a.uid.localeCompare(b.uid);
    });

  return (
    <>
      <ElementFilter value={el} onChange={setEl} />
      <div className="segment" role="group" aria-label="並べ替え">
        {(Object.keys(SORT_LABEL) as Sort[]).map((s) => (
          <button key={s} aria-pressed={sort === s} onClick={() => setSort(s)}>
            {SORT_LABEL[s]}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <div className="empty">{emptyText}</div>
      ) : (
        <div className="mon-grid">
          {list.map((o) => (
            <MonsterTile
              key={o.uid}
              owned={o}
              selected={isSelected?.(o)}
              disabled={isDisabled?.(o)}
              onClick={() => onPick(o)}
            />
          ))}
        </div>
      )}
    </>
  );
}
