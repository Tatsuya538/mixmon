import { describe, expect, it } from 'vitest';
import {
  exchange,
  exchangeTargets,
  needsSellConfirm,
  selectDuplicates,
  sellPrice,
  totalSellPrice,
} from '../src/domain/exchange';
import { seededRng } from '../src/domain/rng';
import { catalog, idByName, owned } from './helpers';

describe('交換所', () => {
  it('売却額は N=1pt / R=5pt、SR以上は売却不可', () => {
    expect(sellPrice(catalog, owned(idByName('ヒノコロ')))).toBe(1);
    expect(sellPrice(catalog, owned(idByName('フレイガル')))).toBe(5);
    expect(sellPrice(catalog, owned(idByName('グレンオー')))).toBeNull();
    expect(() => totalSellPrice(catalog, [owned(idByName('グレンオー'))])).toThrow();
  });

  it('レシピ限定のRも売却できる', () => {
    expect(sellPrice(catalog, owned(idByName('ユゲドラ')))).toBe(5);
  });

  it('色違い・＋5以上は売却前に確認', () => {
    expect(needsSellConfirm(owned('m001', { shiny: true }))).toBe(true);
    expect(needsSellConfirm(owned('m001', { plus: 5 }))).toBe(true);
    expect(needsSellConfirm(owned('m001', { plus: 4 }))).toBe(false);
  });

  it('指名交換は N=10pt / R=50pt で、対象はガチャ対象の54体', () => {
    expect(exchangeTargets(catalog)).toHaveLength(54);
    const n = exchange(catalog, 10, idByName('ヒノコロ'), seededRng(1), 0);
    expect(n.points).toBe(0);
    expect(n.monster).toMatchObject({ monsterId: idByName('ヒノコロ'), plus: 0, shiny: false, origin: 'exchange' });
    expect(exchange(catalog, 60, idByName('フレイガル'), seededRng(1), 0).points).toBe(10);
  });

  it('pt不足・対象外はエラー', () => {
    expect(() => exchange(catalog, 9, idByName('ヒノコロ'), seededRng(1), 0)).toThrow();
    expect(() => exchange(catalog, 999, idByName('ユゲドラ'), seededRng(1), 0)).toThrow();
  });
});

describe('ダブり一括選択', () => {
  it('種類ごとに最良の1体を残し、確認が必要な個体と売却不可は選ばない', () => {
    const hino = idByName('ヒノコロ');
    const best = owned(hino, { plus: 3 });
    const dup1 = owned(hino);
    const dup2 = owned(hino, { plus: 1 });
    const shinyDup = owned(idByName('ミズプル'), { shiny: true });
    const mizu = owned(idByName('ミズプル'), { plus: 2 });
    const sr1 = owned(idByName('グレンオー'));
    const sr2 = owned(idByName('グレンオー'));
    const uids = selectDuplicates(catalog, [dup1, best, dup2, shinyDup, mizu, sr1, sr2]);
    expect(uids.sort()).toEqual([dup1.uid, dup2.uid, mizu.uid].sort());
  });
});
