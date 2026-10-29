/**
 * ゲーム操作（アプリケーション層）。状態を受け取り「保存すべき変更」と「演出用の結果」を返す純粋関数。
 * UI(store) はこの戻り値の changes を GameRepository.commit に渡すだけにする。
 */
import type { Catalog } from './catalog';
import { registerDex } from './dex';
import { exchange, totalSellPrice } from './exchange';
import { consumeDaily, drawMany, drawOne, localDateKey, MULTI_COUNT, refreshDaily, type GachaKind } from './gacha';
import { createUid, type Rng } from './rng';
import { synthesize, type SynthesisResult } from './synthesis';
import { ELEMENTS, type OwnedMonster, type PlayerState } from './types';

export interface GameState {
  player: PlayerState;
  monsters: OwnedMonster[];
}

/** 1回の操作で保存する変更（まとめて1トランザクションで書く） */
export interface Changes {
  player: PlayerState;
  put: OwnedMonster[];
  remove: string[];
}

export interface Ctx {
  catalog: Catalog;
  rng: Rng;
  now: number;
}

export interface Acquired {
  monster: OwnedMonster;
  newNormal: boolean;
  newShiny: boolean;
}

export function applyChanges(state: GameState, c: Changes): GameState {
  const removed = new Set(c.remove);
  return { player: c.player, monsters: [...state.monsters.filter((m) => !removed.has(m.uid)), ...c.put] };
}

/** 入手した個体を図鑑に登録しつつ player を更新する */
function acquire(player: PlayerState, monsters: OwnedMonster[]): { player: PlayerState; acquired: Acquired[] } {
  let dex = player.dex;
  const acquired = monsters.map((monster) => {
    const reg = registerDex(dex, monster);
    dex = reg.dex;
    return { monster, newNormal: reg.newNormal, newShiny: reg.newShiny };
  });
  return { player: { ...player, dex }, acquired };
}

function findOwned(state: GameState, uid: string): OwnedMonster {
  const o = state.monsters.find((m) => m.uid === uid);
  if (!o) throw new Error(`所持していない個体: ${uid}`);
  return o;
}

/** 初期所持: 各属性のNをID順に2体ずつ（計10体。ヒノコロ×ミズプルですぐ特殊合成を体験できる） */
export const STARTERS_PER_ELEMENT = 2;

export function newGame(ctx: Ctx): GameState {
  const starters: OwnedMonster[] = ELEMENTS.flatMap((el) =>
    ctx.catalog.monsters
      .filter((m) => m.rank === 'N' && m.element === el)
      .sort((x, y) => x.no - y.no)
      .slice(0, STARTERS_PER_ELEMENT),
  ).map((m) => ({
    uid: createUid(ctx.rng),
    monsterId: m.id,
    plus: 0,
    shiny: false,
    obtainedAt: ctx.now,
    origin: 'initial',
    lineage: { parents: null, grandparents: [] },
  }));
  const base: PlayerState = {
    points: 0,
    daily: { date: localDateKey(ctx.now), freeUsed: 0, adUsed: 0 },
    dex: {},
    discoveredRecipes: [],
  };
  return { player: acquire(base, starters).player, monsters: starters };
}

export interface SynthesisOutcome extends SynthesisResult, Acquired {
  newRecipe: boolean;
}

export function synthesisAction(state: GameState, uidA: string, uidB: string, ctx: Ctx) {
  const a = findOwned(state, uidA);
  const b = findOwned(state, uidB);
  const result = synthesize(ctx.catalog, a, b, ctx.rng, ctx.now);
  const { player, acquired } = acquire(state.player, [result.child]);
  const newRecipe = !!result.recipe && !player.discoveredRecipes.includes(result.recipe.id);
  const nextPlayer = newRecipe
    ? { ...player, discoveredRecipes: [...player.discoveredRecipes, result.recipe!.id] }
    : player;
  const outcome: SynthesisOutcome = { ...result, ...acquired[0], newRecipe };
  const changes: Changes = { player: nextPlayer, put: [result.child], remove: [a.uid, b.uid] };
  return { changes, outcome };
}

/** paid10 は購入処理（PurchaseService）が成功した後に呼ぶこと */
export function gachaAction(state: GameState, kind: GachaKind, ctx: Ctx) {
  let player = { ...state.player, daily: refreshDaily(state.player.daily, ctx.now) };
  let pulled: OwnedMonster[];
  if (kind === 'paid10') {
    pulled = drawMany(ctx.catalog, ctx.rng, ctx.now, MULTI_COUNT);
  } else {
    player = { ...player, daily: consumeDaily(player.daily, kind, ctx.now) };
    pulled = [drawOne(ctx.catalog, ctx.rng, ctx.now)];
  }
  const r = acquire(player, pulled);
  const changes: Changes = { player: r.player, put: pulled, remove: [] };
  return { changes, acquired: r.acquired };
}

export function sellAction(state: GameState, uids: string[], ctx: Pick<Ctx, 'catalog'>) {
  const unique = [...new Set(uids)];
  const items = unique.map((uid) => findOwned(state, uid));
  const gained = totalSellPrice(ctx.catalog, items);
  const changes: Changes = {
    player: { ...state.player, points: state.player.points + gained },
    put: [],
    remove: unique,
  };
  return { changes, gained };
}

export function exchangeAction(state: GameState, monsterId: string, ctx: Ctx) {
  const ex = exchange(ctx.catalog, state.player.points, monsterId, ctx.rng, ctx.now);
  const r = acquire({ ...state.player, points: ex.points }, [ex.monster]);
  const changes: Changes = { player: r.player, put: [ex.monster], remove: [] };
  return { changes, acquired: r.acquired[0] };
}
