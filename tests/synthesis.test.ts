import { describe, expect, it } from 'vitest';
import { getMonster } from '../src/domain/catalog';
import { seededRng, sequenceRng } from '../src/domain/rng';
import { previewSynthesis, synthesize } from '../src/domain/synthesis';
import { catalog, idByName, owned } from './helpers';

const id = idByName;
const childName = (a: string, b: string, rng = sequenceRng([0.9, 0.9])) =>
  getMonster(catalog, synthesize(catalog, owned(id(a)), owned(id(b)), rng, 0).child.monsterId).name;

describe('属性合成', () => {
  it('子の属性は属性合成表、候補は（ID番号の和）÷候補数の余り番目', () => {
    // 炎×雷＝炎、炎N候補 m001〜m006、(1+13)%6=2 → m003
    expect(childName('ヒノコロ', 'ビリット')).toBe('カエンボ');
    // 炎×水＝雷、雷N候補 m013〜m018、(2+8)%6=4 → m017
    expect(childName('ホムラン', 'シズクン')).toBe('スパッキー');
    // 森×影＝雷
    expect(getMonster(catalog, id(childName('モリプル', 'カゲモン'))).element).toBe('thunder');
  });

  it('同じ組み合わせなら毎回同じ結果（親の順番も問わない）', () => {
    const results = [1, 2, 3].flatMap((seed) => [
      childName('ホムラン', 'シズクン', seededRng(seed)),
      childName('シズクン', 'ホムラン', seededRng(seed)),
    ]);
    // ランクアップした回は R になるので、N の結果だけを比べる
    expect(new Set(results.filter((n) => getMonster(catalog, idByName(n)).rank === 'N'))).toEqual(
      new Set(['スパッキー']),
    );
  });

  it('乱数が0.3未満なら1ランク上がる（候補も上のランクから選ぶ）', () => {
    // 炎R候補 m031〜m035、(1+13)%5=4 → m035
    const r = synthesize(catalog, owned(id('ヒノコロ')), owned(id('ビリット')), sequenceRng([0.29, 0.9]), 0);
    expect(getMonster(catalog, r.child.monsterId).name).toBe('ネッパード');
    expect(r.rankUp).toBe(true);
  });

  it('乱数が0.3ちょうどなら上がらない', () => {
    expect(childName('ヒノコロ', 'ビリット', sequenceRng([0.3, 0.9]))).toBe('カエンボ');
  });

  it('★は候補から除かれる（水R候補 m037〜m040）', () => {
    // 水×水、(7+37)%4=0 → m037
    expect(childName('ミズプル', 'アクアレス')).toBe('アクアレス');
  });

  it('SRは上限なのでそれ以上上がらない', () => {
    const r = synthesize(catalog, owned(id('グレンオー')), owned(id('ミズプル')), sequenceRng([0, 0.9]), 0);
    expect(getMonster(catalog, r.child.monsterId).rank).toBe('SR');
    expect(r.rankUp).toBe(false);
  });

  it('UR・LRの親はSRとして扱う', () => {
    // 炎×水＝雷、雷SR候補 m062〜m064、(71+7)%3=0 → m062
    expect(childName('ソルガルーダ', 'ミズプル')).toBe('ライメイオー');
  });

  it('どの組み合わせでも必ず何かが生まれ、レシピ外でUR・LR・★は生まれない', () => {
    for (const a of catalog.monsters) {
      for (const b of catalog.monsters) {
        const p = previewSynthesis(catalog, owned(a.id), owned(b.id));
        expect(p.outcomes.length).toBeGreaterThan(0);
        if (!p.recipe) for (const m of p.outcomes) expect(m.source).not.toBe('recipe');
      }
    }
  });

  it('上振れ率は約30%', () => {
    const rng = seededRng(7);
    let up = 0;
    const n = 20000;
    for (let i = 0; i < n; i++)
      if (synthesize(catalog, owned(id('ホムラン')), owned(id('シズクン')), rng, 0).rankUp) up++;
    expect(up / n).toBeGreaterThan(0.28);
    expect(up / n).toBeLessThan(0.32);
  });
});

describe('特殊合成', () => {
  it('レシピの組み合わせは属性合成より優先される（順不同・ランクアップなし）', () => {
    expect(childName('ヒノコロ', 'ミズプル', sequenceRng([0, 0.9]))).toBe('ユゲドラ');
    expect(childName('ミズプル', 'ヒノコロ', sequenceRng([0, 0.9]))).toBe('ユゲドラ');
    const r = synthesize(catalog, owned(id('ヒノコロ')), owned(id('ミズプル')), seededRng(3), 0);
    expect(r.recipe?.story).toBe('火と水が出会い湯気の竜に');
    expect(r.rankUp).toBe(false);
  });

  it('全12レシピがそれぞれの結果を生む', () => {
    for (const r of catalog.recipes) {
      const res = synthesize(catalog, owned(r.parents[0]), owned(r.parents[1]), seededRng(1), 0);
      expect(res.child.monsterId).toBe(r.result);
    }
  });
});

describe('＋値・色違い・家系図', () => {
  it('子の＋値 = 親Aの＋値 + 親Bの＋値 + 1', () => {
    const r = synthesize(
      catalog,
      owned(id('ヒノコロ'), { plus: 2 }),
      owned(id('ミズプル'), { plus: 3 }),
      seededRng(1),
      0,
    );
    expect(r.child.plus).toBe(6);
  });

  it('片親が色違いなら子は色違い確定', () => {
    const r = synthesize(
      catalog,
      owned(id('ホムラン'), { shiny: true }),
      owned(id('シズクン')),
      sequenceRng([0.9, 0.99]),
      0,
    );
    expect(r.child.shiny).toBe(true);
    expect(r.doubleShiny).toBe(false);
  });

  it('両親とも色違いなら確定＋特別エフェクト', () => {
    const r = synthesize(
      catalog,
      owned(id('ホムラン'), { shiny: true }),
      owned(id('シズクン'), { shiny: true }),
      seededRng(1),
      0,
    );
    expect(r.child.shiny).toBe(true);
    expect(r.doubleShiny).toBe(true);
  });

  it('通常同士は乱数が0.001未満のときだけ色違い', () => {
    // 消費順: 上振れ判定, 色違い判定
    const shinyOf = (v: number) =>
      synthesize(catalog, owned(id('ホムラン')), owned(id('シズクン')), sequenceRng([0.9, v]), 0).child.shiny;
    expect(shinyOf(0.0009)).toBe(true);
    expect(shinyOf(0.001)).toBe(false);
    // レシピでも色違い判定はある（上振れ判定はしない）
    expect(
      synthesize(catalog, owned(id('ヒノコロ')), owned(id('ミズプル')), sequenceRng([0.0009]), 0).child.shiny,
    ).toBe(true);
  });

  it('家系図に親と祖父母（名前・＋値・色違い）を記録する', () => {
    const a = synthesize(catalog, owned(id('ヒノコロ'), { shiny: true }), owned(id('ホムラン')), seededRng(1), 0).child;
    const b = owned(id('ミズプル'), { plus: 3 });
    const r = synthesize(catalog, a, b, seededRng(2), 0);
    expect(r.child.lineage.parents?.[1]).toEqual({
      monsterId: id('ミズプル'),
      name: 'ミズプル',
      plus: 3,
      shiny: false,
    });
    expect(r.child.lineage.grandparents).toEqual([
      { monsterId: id('ヒノコロ'), name: 'ヒノコロ', plus: 0, shiny: true },
      { monsterId: id('ホムラン'), name: 'ホムラン', plus: 0, shiny: false },
      null,
      null,
    ]);
  });

  it('同じ個体同士は合成できない', () => {
    const a = owned(id('ヒノコロ'));
    expect(() => synthesize(catalog, a, a, seededRng(1), 0)).toThrow();
  });
});

describe('合成予測', () => {
  it('レシピ: 色違いヒノコロ+2 × ミズプル+3 → 水 / R / +6 / 色違い確定 / ユゲドラ', () => {
    const p = previewSynthesis(
      catalog,
      owned(id('ヒノコロ'), { shiny: true, plus: 2 }),
      owned(id('ミズプル'), { plus: 3 }),
    );
    expect(p).toMatchObject({ element: 'water', minRank: 'R', maxRank: 'R', plus: 6, shiny: 'guaranteed' });
    expect(p.outcomes.map((m) => m.name)).toEqual(['ユゲドラ']);
    expect(p.recipe?.id).toBe('r01');
  });

  it('属性合成: 上振れなし／ありの2体を返す', () => {
    const p = previewSynthesis(catalog, owned(id('ホムラン')), owned(id('シズクン')));
    expect(p).toMatchObject({ element: 'thunder', minRank: 'N', maxRank: 'R' });
    // 雷R候補 m041〜m045、(2+8)%5=0 → m041
    expect(p.outcomes.map((m) => m.name)).toEqual(['スパッキー', 'ボルトガ']);
  });

  it('SR親の予測は SR のみ', () => {
    const p = previewSynthesis(catalog, owned(id('グレンオー')), owned(id('ミズプル')));
    expect([p.minRank, p.maxRank]).toEqual(['SR', 'SR']);
    expect(p.outcomes).toHaveLength(1);
  });
});
