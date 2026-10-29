/** 0以上1未満を返す乱数源。テストでは固定値やシード付きに差し替える */
export interface Rng {
  next(): number;
}

export const mathRng: Rng = { next: () => Math.random() };

/** シード付き乱数（mulberry32） */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return {
    next() {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

/** 決まった値を順に返す（テスト用）。尽きたら最後の値を返し続ける */
export function sequenceRng(values: number[]): Rng {
  let i = 0;
  return { next: () => values[Math.min(i++, values.length - 1)] };
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) throw new Error('pick: empty list');
  return items[Math.floor(rng.next() * items.length)];
}

export function createUid(rng: Rng = mathRng): string {
  return Date.now().toString(36) + Math.floor(rng.next() * 1e12).toString(36);
}
