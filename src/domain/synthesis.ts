import { childElement, getMonster, synthesisPool, type Catalog } from './catalog';
import { RANK_ORDER } from './labels';
import { createUid, type Rng } from './rng';
import {
  RANKS,
  type Element,
  type LineageEntry,
  type Monster,
  type OwnedMonster,
  type Rank,
  type Recipe,
} from './types';

export const RANK_UP_RATE = 0.3;
export const NORMAL_SHINY_RATE = 0.001;
/** 属性合成で生まれるランクの上限 */
export const SYNTHESIS_RANK_CAP: Rank = 'SR';

export function findRecipe(catalog: Catalog, idA: string, idB: string): Recipe | undefined {
  return catalog.recipes.find(
    (r) => (r.parents[0] === idA && r.parents[1] === idB) || (r.parents[0] === idB && r.parents[1] === idA),
  );
}

function capRank(rank: Rank): Rank {
  return RANK_ORDER[rank] > RANK_ORDER[SYNTHESIS_RANK_CAP] ? SYNTHESIS_RANK_CAP : rank;
}

function higherRank(a: Rank, b: Rank): Rank {
  return RANK_ORDER[a] >= RANK_ORDER[b] ? a : b;
}

function nextRank(rank: Rank): Rank {
  return RANKS[RANK_ORDER[rank] + 1] ?? rank;
}

export type ShinyOutlook = 'double' | 'guaranteed' | 'rare';

export function shinyOutlook(a: OwnedMonster, b: OwnedMonster): ShinyOutlook {
  if (a.shiny && b.shiny) return 'double';
  if (a.shiny || b.shiny) return 'guaranteed';
  return 'rare';
}

export function childPlus(a: OwnedMonster, b: OwnedMonster): number {
  return a.plus + b.plus + 1;
}

/**
 * 属性合成で生まれるモンスター。候補（属性×ランク、★除く、ID順）のうち
 * （親AのID番号 + 親BのID番号）÷ 候補数 の余り番目（0始まり）を選ぶ。同じ組み合わせなら毎回同じ結果になる。
 */
export function elementalChild(catalog: Catalog, a: Monster, b: Monster, rank: Rank): Monster {
  const pool = synthesisPool(catalog, childElement(catalog, a.element, b.element), rank);
  if (pool.length === 0) throw new Error(`属性合成の候補がない: ${a.id} × ${b.id} (${rank})`);
  return pool[(a.no + b.no) % pool.length];
}

/** 属性合成の基準ランク（親の高い方。UR・LRはSRとして扱う） */
function baseRank(a: Monster, b: Monster): Rank {
  return capRank(higherRank(a.rank, b.rank));
}

export interface SynthesisPreview {
  /** 子の属性 */
  element: Element;
  minRank: Rank;
  maxRank: Rank;
  /** 生まれうるモンスター（レシピなら1体、属性合成なら上振れなし/ありの1〜2体） */
  outcomes: Monster[];
  plus: number;
  shiny: ShinyOutlook;
  /** 一致するレシピ（UIは発見済みのときだけ中身を見せる） */
  recipe?: Recipe;
}

export function previewSynthesis(catalog: Catalog, a: OwnedMonster, b: OwnedMonster): SynthesisPreview {
  const ma = getMonster(catalog, a.monsterId);
  const mb = getMonster(catalog, b.monsterId);
  const common = { plus: childPlus(a, b), shiny: shinyOutlook(a, b) };
  const recipe = findRecipe(catalog, ma.id, mb.id);
  if (recipe) {
    const r = getMonster(catalog, recipe.result);
    return { ...common, element: r.element, minRank: r.rank, maxRank: r.rank, outcomes: [r], recipe };
  }
  const base = baseRank(ma, mb);
  const up = base === SYNTHESIS_RANK_CAP ? base : nextRank(base);
  const outcomes = [elementalChild(catalog, ma, mb, base)];
  if (up !== base) outcomes.push(elementalChild(catalog, ma, mb, up));
  return { ...common, element: childElement(catalog, ma.element, mb.element), minRank: base, maxRank: up, outcomes };
}

export interface SynthesisResult {
  child: OwnedMonster;
  recipe?: Recipe;
  rankUp: boolean;
  /** 両親とも色違い（特別エフェクト用） */
  doubleShiny: boolean;
}

function toEntry(catalog: Catalog, o: OwnedMonster): LineageEntry {
  return { monsterId: o.monsterId, name: getMonster(catalog, o.monsterId).name, plus: o.plus, shiny: o.shiny };
}

/**
 * 合成を実行して子を返す（親の削除は呼び出し側で行う）。
 * 乱数の消費順: [ランク上振れ判定]（属性合成かつSR未満のみ） → [色違い判定]（通常同士のみ）
 */
export function synthesize(catalog: Catalog, a: OwnedMonster, b: OwnedMonster, rng: Rng, now: number): SynthesisResult {
  if (a.uid === b.uid) throw new Error('同じ個体同士は合成できない');
  const ma = getMonster(catalog, a.monsterId);
  const mb = getMonster(catalog, b.monsterId);
  const recipe = findRecipe(catalog, ma.id, mb.id);

  let childId: string;
  let rankUp = false;
  if (recipe) {
    childId = recipe.result;
  } else {
    let rank = baseRank(ma, mb);
    if (rank !== SYNTHESIS_RANK_CAP && rng.next() < RANK_UP_RATE) {
      rank = nextRank(rank);
      rankUp = true;
    }
    childId = elementalChild(catalog, ma, mb, rank).id;
  }

  const outlook = shinyOutlook(a, b);
  const shiny = outlook !== 'rare' || rng.next() < NORMAL_SHINY_RATE;

  const child: OwnedMonster = {
    uid: createUid(rng),
    monsterId: childId,
    plus: childPlus(a, b),
    shiny,
    obtainedAt: now,
    origin: 'synthesis',
    lineage: {
      parents: [toEntry(catalog, a), toEntry(catalog, b)],
      grandparents: [...(a.lineage.parents ?? [null, null]), ...(b.lineage.parents ?? [null, null])],
    },
  };
  return { child, recipe, rankUp, doubleShiny: outlook === 'double' };
}
