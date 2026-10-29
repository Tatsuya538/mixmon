import { describe, expect, it } from 'vitest';
import { getMonster } from '../src/domain/catalog';
import { adRemaining, consumeDaily, drawOne, freeRemaining, GACHA_RATES, refreshDaily } from '../src/domain/gacha';
import { seededRng, sequenceRng } from '../src/domain/rng';
import { catalog } from './helpers';

const day1 = new Date(2026, 8, 26, 10).getTime();
const day1Late = new Date(2026, 8, 26, 23, 59).getTime();
const day2 = new Date(2026, 8, 27, 0, 0).getTime();

describe('ガチャ抽選', () => {
  it('排出率の合計は100%', () => {
    expect(GACHA_RATES.reduce((s, g) => s + g.rate, 0)).toBeCloseTo(1);
  });

  it('乱数0.85未満はN、以上はR', () => {
    expect(getMonster(catalog, drawOne(catalog, sequenceRng([0.8499, 0, 0.5]), 0).monsterId).rank).toBe('N');
    expect(getMonster(catalog, drawOne(catalog, sequenceRng([0.85, 0, 0.5]), 0).monsterId).rank).toBe('R');
  });

  it('色違いは別枠で0.2%', () => {
    expect(drawOne(catalog, sequenceRng([0.5, 0, 0.0019]), 0).shiny).toBe(true);
    expect(drawOne(catalog, sequenceRng([0.5, 0, 0.002]), 0).shiny).toBe(false);
  });

  it('大量試行で N≒85% / R≒15%、ガチャ対象外は出ない', () => {
    const rng = seededRng(99);
    const n = 50000;
    let r = 0;
    let shiny = 0;
    for (let i = 0; i < n; i++) {
      const o = drawOne(catalog, rng, 0);
      const m = getMonster(catalog, o.monsterId);
      expect(m.source).toBe('gacha');
      if (m.rank === 'R') r++;
      if (o.shiny) shiny++;
    }
    expect(r / n).toBeGreaterThan(0.14);
    expect(r / n).toBeLessThan(0.16);
    expect(shiny / n).toBeGreaterThan(0.001);
    expect(shiny / n).toBeLessThan(0.003);
  });
});

describe('日次回数', () => {
  const fresh = { date: '2026-09-26', freeUsed: 0, adUsed: 0 };

  it('無料は1日1回', () => {
    const d = consumeDaily(fresh, 'free', day1);
    expect(freeRemaining(d, day1)).toBe(0);
    expect(() => consumeDaily(d, 'free', day1Late)).toThrow();
  });

  it('広告は1日3回まで', () => {
    let d = fresh;
    for (let i = 0; i < 3; i++) d = consumeDaily(d, 'ad', day1);
    expect(adRemaining(d, day1)).toBe(0);
    expect(() => consumeDaily(d, 'ad', day1)).toThrow();
  });

  it('端末ローカルの0時で回数がリセットされる', () => {
    const used = { date: '2026-09-26', freeUsed: 1, adUsed: 3 };
    expect(freeRemaining(used, day2)).toBe(1);
    expect(adRemaining(used, day2)).toBe(3);
    expect(refreshDaily(used, day2).date).toBe('2026-09-27');
  });
});
