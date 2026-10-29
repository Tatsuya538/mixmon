import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { dexHint, dexProgress } from '../src/domain/dex';
import {
  applyChanges,
  exchangeAction,
  gachaAction,
  newGame,
  sellAction,
  synthesisAction,
  type Ctx,
} from '../src/domain/game';
import { seededRng } from '../src/domain/rng';
import { IndexedDbRepository } from '../src/storage/IndexedDbRepository';
import { MemoryRepository } from '../src/storage/MemoryRepository';
import { migratePlayer, SAVE_VERSION } from '../src/storage/migrations';
import { catalog, idByName } from './helpers';

const now = new Date(2026, 8, 26, 12).getTime();
const ctx = (seed = 1): Ctx => ({ catalog, rng: seededRng(seed), now });

describe('ゲーム操作', () => {
  it('新規ゲームは各属性のNを2体ずつ（計10体）所持し、図鑑に登録済み', () => {
    const s = newGame(ctx());
    expect(s.monsters).toHaveLength(10);
    expect(dexProgress(s.player.dex)).toEqual({ normal: 10, shiny: 0 });
    expect(s.monsters.map((m) => m.monsterId).sort()).toEqual([
      'm001',
      'm002',
      'm007',
      'm008',
      'm013',
      'm014',
      'm019',
      'm020',
      'm025',
      'm026',
    ]);
  });

  it('合成で親2体が消えて子が増え、図鑑とレシピ発見が更新される', () => {
    const s = newGame(ctx());
    const [a, b] = [idByName('ヒノコロ'), idByName('ミズプル')].map((id) =>
      s.monsters.find((m) => m.monsterId === id)!,
    );
    const { changes, outcome } = synthesisAction(s, a.uid, b.uid, ctx());
    const next = applyChanges(s, changes);
    expect(next.monsters).toHaveLength(9);
    expect(outcome.child.monsterId).toBe(idByName('ユゲドラ'));
    expect(outcome.newNormal).toBe(true);
    expect(outcome.newRecipe).toBe(true);
    expect(next.player.discoveredRecipes).toEqual([outcome.recipe!.id]);
  });

  it('無料ガチャは1回で、2回目はエラー', () => {
    const s = newGame(ctx());
    const r = gachaAction(s, 'free', ctx());
    const next = applyChanges(s, r.changes);
    expect(next.monsters).toHaveLength(11);
    expect(() => gachaAction(next, 'free', ctx())).toThrow();
  });

  it('10連は日次回数を消費しない', () => {
    const s = newGame(ctx());
    const r = gachaAction(s, 'paid10', ctx());
    expect(r.acquired).toHaveLength(10);
    expect(r.changes.player.daily.freeUsed).toBe(0);
  });

  it('売却→指名交換', () => {
    let s = newGame(ctx());
    const sell = sellAction(
      s,
      s.monsters.map((m) => m.uid),
      ctx(),
    );
    expect(sell.gained).toBe(10);
    s = applyChanges(s, sell.changes);
    expect(s.monsters).toHaveLength(0);
    const ex = exchangeAction(s, idByName('ヒノコロ'), ctx());
    s = applyChanges(s, ex.changes);
    expect(s.player.points).toBe(0);
    expect(s.monsters).toHaveLength(1);
  });

  it('図鑑ヒントは必要な属性の組み合わせを示す', () => {
    // 炎になる組み合わせ: 炎×炎・炎×雷・炎×影
    expect(dexHint(catalog, idByName('ヴォルガイア'))).toBe('炎属性のSR。炎×炎・炎×雷・炎×影 の合成で生まれるらしい');
    expect(dexHint(catalog, idByName('アルカディオン'))).toContain('特殊合成');
    expect(dexHint(catalog, idByName('ヒノコロ'))).toContain('ガチャ');
  });
});

describe('ストレージ', () => {
  for (const [name, make] of [
    ['Memory', () => new MemoryRepository()],
    ['IndexedDB', () => new IndexedDbRepository(`test-${Math.random()}`)],
  ] as const) {
    it(`${name}: init → commit → load で状態が一致する`, async () => {
      const repo = make();
      expect(await repo.load()).toBeNull();
      const s = newGame(ctx());
      await repo.init(s);
      const [a, b] = s.monsters;
      const { changes } = synthesisAction(s, a.uid, b.uid, ctx());
      await repo.commit(changes);
      const loaded = await repo.load();
      const expected = applyChanges(s, changes);
      expect(loaded?.player).toEqual(expected.player);
      expect(loaded?.monsters.map((m) => m.uid).sort()).toEqual(expected.monsters.map((m) => m.uid).sort());
      await repo.reset();
      expect(await repo.load()).toBeNull();
    });
  }
});

describe('セーブデータの移行', () => {
  it('v1（開発中の旧モンスター一覧）は引き継がず新規ゲームにする', () => {
    expect(migratePlayer({ version: 1, points: 5 })).toBeNull();
    expect(migratePlayer({ points: 5 })).toBeNull();
  });

  it('現行バージョンはそのまま読み込む', () => {
    expect(migratePlayer({ version: SAVE_VERSION, points: 5 })).toEqual({ points: 5 });
  });

  it('IndexedDB に v1 のセーブがあれば load は null を返す', async () => {
    const repo = new IndexedDbRepository(`test-${Math.random()}`);
    const s = newGame(ctx());
    await repo.init(s);
    // init は現行バージョンで書くので、v1 のセーブを直接書き込む
    const { openDB } = await import('idb');
    const db = await openDB((repo as unknown as { dbName: string }).dbName);
    await db.put('player', { ...s.player, version: 1 }, 'me');
    db.close();
    expect(await repo.load()).toBeNull();
  });
});
