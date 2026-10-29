import { catalog } from '../src/data';
import type { OwnedMonster } from '../src/domain/types';

export { catalog };

let seq = 0;
export function owned(monsterId: string, over: Partial<OwnedMonster> = {}): OwnedMonster {
  return {
    uid: `u${++seq}`,
    monsterId,
    plus: 0,
    shiny: false,
    obtainedAt: 0,
    origin: 'gacha',
    lineage: { parents: null, grandparents: [] },
    ...over,
  };
}

export function idByName(name: string): string {
  const m = catalog.monsters.find((x) => x.name === name);
  if (!m) throw new Error(name);
  return m.id;
}
