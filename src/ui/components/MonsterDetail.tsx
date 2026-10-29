import { getMonster } from '../../domain/catalog';
import { elementText } from '../../domain/labels';
import type { LineageEntry, OwnedMonster } from '../../domain/types';
import { catalog } from '../../data';
import { Plus, RankBadge } from './Badges';
import './MonsterDetail.css';

export function StatBoxes({ monsterId }: { monsterId: string }) {
  const m = getMonster(catalog, monsterId);
  const stats = [
    ['HP', m.hp],
    ['攻撃', m.atk],
    ['防御', m.def],
    ['素早さ', m.spd],
  ] as const;
  return (
    <div className="stat-boxes">
      {stats.map(([label, v]) => (
        <div key={label} className="stat-box">
          <span>{label}</span>
          <b>{v}</b>
        </div>
      ))}
    </div>
  );
}

export function RankLine({ owned }: { owned: Pick<OwnedMonster, 'monsterId' | 'plus'> }) {
  const m = getMonster(catalog, owned.monsterId);
  return (
    <div className="rank-line">
      <RankBadge rank={m.rank} />
      <span className="el-chip">{elementText(m)}</span>
      <Plus value={owned.plus} />
    </div>
  );
}

function LineageChip({ entry, detail }: { entry: LineageEntry; detail: boolean }) {
  return (
    <span className={`lineage-chip${entry.shiny ? ' shiny' : ''}`}>
      {entry.shiny ? '色違い' : ''}
      {entry.name}
      {detail || entry.plus > 0 ? ` +${entry.plus}` : ''}
    </span>
  );
}

export function LineageCard({ owned }: { owned: OwnedMonster }) {
  const { parents, grandparents } = owned.lineage;
  const gps = grandparents.filter((g): g is LineageEntry => g !== null);
  return (
    <section className="card lineage">
      <h3>家系図</h3>
      {!parents ? (
        <p className="text-dim">
          {owned.origin === 'gacha' ? 'ガチャ' : owned.origin === 'exchange' ? '交換所' : 'はじめの仲間'}
          で出会ったモンスター
        </p>
      ) : (
        <dl>
          <dt>親</dt>
          <dd>
            {parents.map((p, i) => (
              <LineageChip key={i} entry={p} detail />
            ))}
          </dd>
          <dt>祖父母</dt>
          <dd>
            {gps.length ? (
              gps.map((g, i) => <LineageChip key={i} entry={g} detail={false} />)
            ) : (
              <span className="text-dim">記録なし</span>
            )}
          </dd>
        </dl>
      )}
    </section>
  );
}
