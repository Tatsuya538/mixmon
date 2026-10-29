import { describe, expect, it } from 'vitest';
import { synthesisPool, validateCatalog } from '../src/domain/catalog';
import { gachaPool } from '../src/domain/gacha';
import { previewSynthesis } from '../src/domain/synthesis';
import { generate } from '../scripts/generate-monsters';
import { catalog, idByName, owned } from './helpers';

describe('マスターデータ', () => {
  it('整合性チェックに問題がない', () => {
    expect(validateCatalog(catalog)).toEqual([]);
  });

  it('JSON は生成スクリプトの出力と一致する', () => {
    const g = generate();
    expect(catalog.monsters).toEqual(g.monsters);
    expect(catalog.recipes).toEqual(g.recipes);
    expect(catalog.elementTable).toEqual(g.elementTable);
  });

  it('一覧どおりのIDと名前（各ランクの先頭・末尾）', () => {
    const name = (id: string) => catalog.byId.get(id)?.name;
    expect([name('m001'), name('m030'), name('m031'), name('m036'), name('m055')]).toEqual([
      'ヒノコロ',
      'モヤット',
      'フレイガル',
      'ユゲドラ',
      'ヨミガラス',
    ]);
    expect([name('m056'), name('m061'), name('m070'), name('m071'), name('m077'), name('m080')]).toEqual([
      'ヴォルガイア',
      'ヒョウガミ',
      'ルナリス',
      'ソルガルーダ',
      'ゲンムオウ',
      'カオスノヴァ',
    ]);
  });

  it('★（レシピ限定）は ユゲドラ・ヒョウガミ・UR7体・LR3体の12体', () => {
    const star = catalog.monsters.filter((m) => m.source === 'recipe');
    expect(star.map((m) => m.name).slice(0, 2)).toEqual(['ユゲドラ', 'ヒョウガミ']);
    expect(star).toHaveLength(12);
  });

  it('属性合成表は仕様どおり（例: 炎×水＝雷、炎×森＝影、森×影＝雷）', () => {
    const t = catalog.elementTable;
    expect([t.fire.water, t.fire.forest, t.forest.shadow, t.water.thunder, t.thunder.shadow]).toEqual([
      'thunder',
      'shadow',
      'thunder',
      'water',
      'shadow',
    ]);
  });

  it('レシピは12件で、すべてストーリーを持つ', () => {
    expect(catalog.recipes).toHaveLength(12);
    for (const r of catalog.recipes) expect(r.story).not.toBe('');
  });

  it('ガチャ対象は N30体＋R24体（ユゲドラを除く）', () => {
    expect(gachaPool(catalog, 'N')).toHaveLength(30);
    expect(gachaPool(catalog, 'R')).toHaveLength(24);
    expect(gachaPool(catalog).map((m) => m.name)).not.toContain('ユゲドラ');
  });

  it('属性合成の候補から★は除かれる（水R4体・水SR2体）', () => {
    expect(synthesisPool(catalog, 'water', 'R').map((m) => m.id)).toEqual(['m037', 'm038', 'm039', 'm040']);
    expect(synthesisPool(catalog, 'water', 'SR').map((m) => m.id)).toEqual(['m059', 'm060']);
  });

  it('無課金の経路（ガチャ・交換所→合成）だけで全80体に到達できる', () => {
    // ガチャ対象から出発し、到達済み同士の合成で生まれうるものを不動点まで広げる
    const reachable = new Set(gachaPool(catalog).map((m) => m.id));
    let changed = true;
    while (changed) {
      changed = false;
      const ids = [...reachable];
      for (const a of ids) {
        for (const b of ids) {
          for (const m of previewSynthesis(catalog, owned(a), owned(b)).outcomes) {
            if (!reachable.has(m.id)) {
              reachable.add(m.id);
              changed = true;
            }
          }
        }
      }
    }
    expect(catalog.monsters.filter((m) => !reachable.has(m.id)).map((m) => m.name)).toEqual([]);
  });

  it('LRまでの流れ: ユゲドラ(R)→ヒョウガミ(SR)→ヨミクイーン(UR)→エターナリス(LR)', () => {
    const child = (a: string, b: string) => previewSynthesis(catalog, owned(idByName(a)), owned(idByName(b))).outcomes;
    expect(child('ヒノコロ', 'ミズプル').map((m) => m.name)).toEqual(['ユゲドラ']);
    expect(child('ユゲドラ', 'ゴロゴン').map((m) => m.name)).toEqual(['ヒョウガミ']);
    expect(child('ヒョウガミ', 'ネクロード').map((m) => m.name)).toEqual(['ヨミクイーン']);
    expect(child('ヨミクイーン', 'ウズマキリュウ').map((m) => m.name)).toEqual(['エターナリス']);
  });
});
