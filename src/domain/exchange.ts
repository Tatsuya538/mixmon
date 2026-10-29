import { getMonster, type Catalog } from './catalog';
import { createUid, type Rng } from './rng';
import type { OwnedMonster, Rank } from './types';

export const SELL_PRICE: Partial<Record<Rank, number>> = { N: 1, R: 5 };
export const EXCHANGE_PRICE: Partial<Record<Rank, number>> = { N: 10, R: 50 };
/** これ以上の＋値は売却前に確認する */
export const VALUABLE_PLUS = 5;

/** 売却額。売却できない個体は null */
export function sellPrice(catalog: Catalog, o: OwnedMonster): number | null {
  return SELL_PRICE[getMonster(catalog, o.monsterId).rank] ?? null;
}

/** 誤売却を防ぐため確認が必要な個体か */
export function needsSellConfirm(o: OwnedMonster): boolean {
  return o.shiny || o.plus >= VALUABLE_PLUS;
}

export function totalSellPrice(catalog: Catalog, items: OwnedMonster[]): number {
  return items.reduce((sum, o) => {
    const p = sellPrice(catalog, o);
    if (p === null) throw new Error(`売却できない個体: ${o.uid}`);
    return sum + p;
  }, 0);
}

/** 指名交換の対象（ガチャ対象と同じ単属性N/R） */
export function exchangeTargets(catalog: Catalog) {
  return catalog.monsters.filter((m) => m.source === 'gacha' && EXCHANGE_PRICE[m.rank] !== undefined);
}

export function exchangePrice(catalog: Catalog, monsterId: string): number {
  const m = getMonster(catalog, monsterId);
  const price = EXCHANGE_PRICE[m.rank];
  if (m.source !== 'gacha' || price === undefined) throw new Error(`交換対象外: ${monsterId}`);
  return price;
}

export function exchange(
  catalog: Catalog,
  points: number,
  monsterId: string,
  rng: Rng,
  now: number,
): { points: number; monster: OwnedMonster } {
  const price = exchangePrice(catalog, monsterId);
  if (points < price) throw new Error('ptが足りない');
  return {
    points: points - price,
    monster: {
      uid: createUid(rng),
      monsterId,
      plus: 0,
      shiny: false,
      obtainedAt: now,
      origin: 'exchange',
      lineage: { parents: null, grandparents: [] },
    },
  };
}

/**
 * 「ダブりを一括選択」: 種類ごとに1体（色違い→＋値の高い順で最良の個体）を残し、
 * 残りのうち売却可能かつ確認不要な個体のuidを返す
 */
export function selectDuplicates(catalog: Catalog, owned: OwnedMonster[]): string[] {
  const groups = new Map<string, OwnedMonster[]>();
  for (const o of owned) groups.set(o.monsterId, [...(groups.get(o.monsterId) ?? []), o]);
  const result: string[] = [];
  for (const list of groups.values()) {
    const [, ...rest] = [...list].sort((a, b) => Number(b.shiny) - Number(a.shiny) || b.plus - a.plus);
    for (const o of rest) if (sellPrice(catalog, o) !== null && !needsSellConfirm(o)) result.push(o.uid);
  }
  return result;
}
