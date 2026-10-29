import { getMonster } from '../../domain/catalog';
import type { OwnedMonster } from '../../domain/types';
import { catalog } from '../../data';
import { Plus, RankBadge } from './Badges';
import { SparkleIcon } from './Icons';
import { MonsterArt } from './MonsterArt';

interface Props {
  owned: OwnedMonster;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

/** 所持個体のタイル（親選択・所持一覧・売却で共通） */
export function MonsterTile({ owned, selected, disabled, onClick }: Props) {
  const m = getMonster(catalog, owned.monsterId);
  return (
    <button className="mon-tile" aria-pressed={selected} disabled={disabled} onClick={onClick}>
      {selected && <span className="check">✓</span>}
      {owned.shiny && (
        <span className="corner" aria-label="色違い">
          <SparkleIcon />
        </span>
      )}
      <MonsterArt monster={m} shiny={owned.shiny} sparkles={false} size={52} />
      <span className="name">{m.name}</span>
      <span className="meta">
        <RankBadge rank={m.rank} />
        {owned.plus > 0 && <Plus value={owned.plus} />}
      </span>
    </button>
  );
}
