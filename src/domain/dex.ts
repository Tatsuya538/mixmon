import { getMonster, type Catalog } from './catalog';
import { ELEMENT_LABEL } from './labels';
import { ELEMENTS, type DexEntry, type Element, type OwnedMonster } from './types';

export type Dex = Record<string, DexEntry>;

export interface DexRegistration {
  dex: Dex;
  newNormal: boolean;
  newShiny: boolean;
}

/** 入手した個体を図鑑に登録する。色違いを入手しても通常側は登録しない */
export function registerDex(dex: Dex, o: OwnedMonster): DexRegistration {
  const prev = dex[o.monsterId] ?? { normal: false, shiny: false };
  const next: DexEntry = o.shiny ? { ...prev, shiny: true } : { ...prev, normal: true };
  return {
    dex: { ...dex, [o.monsterId]: next },
    newNormal: !o.shiny && !prev.normal,
    newShiny: o.shiny && !prev.shiny,
  };
}

export function dexProgress(dex: Dex) {
  const entries = Object.values(dex);
  return {
    normal: entries.filter((e) => e.normal).length,
    shiny: entries.filter((e) => e.shiny).length,
  };
}

/** その属性の子が生まれる親の属性の組み合わせ（順不同で重複なし） */
function parentPairsFor(catalog: Catalog, element: Element): string[] {
  const pairs: string[] = [];
  ELEMENTS.forEach((a, i) =>
    ELEMENTS.slice(i).forEach((b) => {
      if (catalog.elementTable[a][b] === element) pairs.push(`${ELEMENT_LABEL[a]}×${ELEMENT_LABEL[b]}`);
    }),
  );
  return pairs;
}

/** 未発見モンスターのヒント（必要な属性の組み合わせ） */
export function dexHint(catalog: Catalog, monsterId: string): string {
  const m = getMonster(catalog, monsterId);
  if (m.source === 'gacha') return 'ガチャや交換所で手に入るらしい';
  if (m.source === 'synthesis') {
    return `${ELEMENT_LABEL[m.element]}属性の${m.rank}。${parentPairsFor(catalog, m.element).join('・')} の合成で生まれるらしい`;
  }
  const recipe = catalog.recipes.find((r) => r.result === m.id);
  if (!recipe) return '謎に包まれている…';
  const [pa, pb] = recipe.parents.map((id) => getMonster(catalog, id));
  return `特殊合成：${ELEMENT_LABEL[pa.element]}の${pa.rank} × ${ELEMENT_LABEL[pb.element]}の${pb.rank} の特別な組み合わせらしい`;
}
