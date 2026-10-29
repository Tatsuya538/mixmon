import { ELEMENTS, type Element, type ElementTable, type Monster, type Rank, type Recipe } from './types';

/** マスターデータ一式。ロジックは JSON を直接 import せず、これを受け取る（テストで差し替え可能にするため） */
export interface Catalog {
  monsters: Monster[];
  recipes: Recipe[];
  elementTable: ElementTable;
  byId: Map<string, Monster>;
}

export function createCatalog(monsters: Monster[], recipes: Recipe[], elementTable: ElementTable): Catalog {
  return { monsters, recipes, elementTable, byId: new Map(monsters.map((m) => [m.id, m])) };
}

export function getMonster(catalog: Catalog, id: string): Monster {
  const m = catalog.byId.get(id);
  if (!m) throw new Error(`unknown monster: ${id}`);
  return m;
}

/** 属性合成で生まれる子の属性 */
export function childElement(catalog: Catalog, a: Element, b: Element): Element {
  return catalog.elementTable[a][b];
}

/** 属性合成の候補（★＝レシピ限定を除く）。ID順 */
export function synthesisPool(catalog: Catalog, element: Element, rank: Rank): Monster[] {
  return catalog.monsters
    .filter((m) => m.source !== 'recipe' && m.rank === rank && m.element === element)
    .sort((x, y) => x.no - y.no);
}

export const EXPECTED_RANK_COUNTS: Record<Rank, number> = { N: 30, R: 25, SR: 15, UR: 7, LR: 3 };

/** データの整合性チェック。問題があればメッセージの配列を返す */
export function validateCatalog(catalog: Catalog): string[] {
  const errors: string[] = [];
  const { monsters, recipes, byId, elementTable } = catalog;
  if (monsters.length !== 80) errors.push(`モンスター数が80ではない: ${monsters.length}`);
  if (byId.size !== monsters.length) errors.push('IDが重複している');
  if (new Set(monsters.map((m) => m.name)).size !== monsters.length) errors.push('名前が重複している');
  for (const m of monsters) {
    if (m.id !== `m${String(m.no).padStart(3, '0')}`) errors.push(`${m.id} のIDと番号が一致しない`);
    if (!ELEMENTS.includes(m.element)) errors.push(`${m.id} 不明な属性: ${m.element}`);
    if ((m.rank === 'UR' || m.rank === 'LR') && m.source !== 'recipe') errors.push(`${m.id} UR/LRはレシピ限定にする`);
    if (m.source === 'gacha' && !(m.rank === 'N' || m.rank === 'R')) errors.push(`${m.id} ガチャ対象はN/Rのみ`);
  }
  for (const [rank, n] of Object.entries(EXPECTED_RANK_COUNTS)) {
    const actual = monsters.filter((m) => m.rank === rank).length;
    if (actual !== n) errors.push(`${rank}の数が${n}ではない: ${actual}`);
  }
  for (const a of ELEMENTS) {
    for (const b of ELEMENTS) {
      const c = elementTable[a]?.[b];
      if (!c || !ELEMENTS.includes(c)) errors.push(`属性合成表に ${a}×${b} がない`);
      else if (c !== elementTable[b]?.[a]) errors.push(`属性合成表が対称でない: ${a}×${b}`);
    }
  }
  for (const el of ELEMENTS) {
    for (const rank of ['N', 'R', 'SR'] as const) {
      if (synthesisPool(catalog, el, rank).length === 0) errors.push(`属性合成の候補がない: ${el} ${rank}`);
    }
  }
  const pairs = new Set<string>();
  for (const r of recipes) {
    const pair = [...r.parents].sort().join('|');
    if (pairs.has(pair)) errors.push(`レシピの組み合わせが重複: ${r.id}`);
    pairs.add(pair);
    for (const id of [...r.parents, r.result]) if (!byId.has(id)) errors.push(`${r.id} 不明なID: ${id}`);
  }
  for (const m of monsters.filter((x) => x.source === 'recipe')) {
    if (!recipes.some((r) => r.result === m.id)) errors.push(`${m.id} を生むレシピがない`);
  }
  return errors;
}
