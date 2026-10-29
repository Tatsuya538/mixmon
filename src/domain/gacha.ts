import type { Catalog } from './catalog';
import { createUid, pick, type Rng } from './rng';
import type { DailyCounter, Monster, OwnedMonster, Rank } from './types';

/** 排出率（ガチャ画面に表示する値もここから取る） */
export const GACHA_RATES: { rank: Rank; rate: number }[] = [
  { rank: 'N', rate: 0.85 },
  { rank: 'R', rate: 0.15 },
];
export const GACHA_SHINY_RATE = 0.002;
export const FREE_PER_DAY = 1;
export const AD_PER_DAY = 3;
export const MULTI_COUNT = 10;

export type GachaKind = 'free' | 'ad' | 'paid10';

export function gachaPool(catalog: Catalog, rank?: Rank): Monster[] {
  return catalog.monsters.filter((m) => m.source === 'gacha' && (rank === undefined || m.rank === rank));
}

/** 乱数の消費順: [ランク判定, 候補選択, 色違い判定] */
export function drawOne(catalog: Catalog, rng: Rng, now: number): OwnedMonster {
  const r = rng.next();
  let acc = 0;
  let rank: Rank = GACHA_RATES[GACHA_RATES.length - 1].rank;
  for (const g of GACHA_RATES) {
    acc += g.rate;
    if (r < acc) {
      rank = g.rank;
      break;
    }
  }
  const monster = pick(rng, gachaPool(catalog, rank));
  const shiny = rng.next() < GACHA_SHINY_RATE;
  return {
    uid: createUid(rng),
    monsterId: monster.id,
    plus: 0,
    shiny,
    obtainedAt: now,
    origin: 'gacha',
    lineage: { parents: null, grandparents: [] },
  };
}

export function drawMany(catalog: Catalog, rng: Rng, now: number, count: number): OwnedMonster[] {
  return Array.from({ length: count }, () => drawOne(catalog, rng, now));
}

/** 端末ローカル時刻の YYYY-MM-DD */
export function localDateKey(now: number): string {
  const d = new Date(now);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** 日付が変わっていれば回数をリセットする */
export function refreshDaily(daily: DailyCounter, now: number): DailyCounter {
  const date = localDateKey(now);
  return daily.date === date ? daily : { date, freeUsed: 0, adUsed: 0 };
}

export function freeRemaining(daily: DailyCounter, now: number): number {
  return Math.max(0, FREE_PER_DAY - refreshDaily(daily, now).freeUsed);
}

export function adRemaining(daily: DailyCounter, now: number): number {
  return Math.max(0, AD_PER_DAY - refreshDaily(daily, now).adUsed);
}

/** 無料/広告の回数を1消費する。残りがなければエラー */
export function consumeDaily(daily: DailyCounter, kind: 'free' | 'ad', now: number): DailyCounter {
  const d = refreshDaily(daily, now);
  if (kind === 'free') {
    if (d.freeUsed >= FREE_PER_DAY) throw new Error('本日の無料ガチャは使用済み');
    return { ...d, freeUsed: d.freeUsed + 1 };
  }
  if (d.adUsed >= AD_PER_DAY) throw new Error('本日の広告ガチャは上限に達した');
  return { ...d, adUsed: d.adUsed + 1 };
}
