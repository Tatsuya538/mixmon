export const ELEMENTS = ['fire', 'water', 'thunder', 'forest', 'shadow'] as const;
export type Element = (typeof ELEMENTS)[number];

export const RANKS = ['N', 'R', 'SR', 'UR', 'LR'] as const;
export type Rank = (typeof RANKS)[number];

/** gacha: ガチャ・交換所で入手可（属性合成でも誕生） / synthesis: 属性合成で誕生 / recipe: 特殊合成限定（★） */
export type MonsterSource = 'gacha' | 'synthesis' | 'recipe';

export interface Monster {
  id: string;
  /** 図鑑番号 */
  no: number;
  name: string;
  rank: Rank;
  element: Element;
  hp: number;
  atk: number;
  def: number;
  spd: number;
  /** 画像ファイル（src/assets/ 以下の相対パス）。ファイルがなければ仮SVGを表示 */
  imagePath: string;
  source: MonsterSource;
}

export interface Recipe {
  id: string;
  /** 親のモンスターID（順不同） */
  parents: [string, string];
  result: string;
  story: string;
}

/** 属性合成表: table[親Aの属性][親Bの属性] = 子の属性 */
export type ElementTable = Record<Element, Record<Element, Element>>;

/** 家系図の1エントリ。表示が将来のデータ変更に影響されないよう名前も控える */
export interface LineageEntry {
  monsterId: string;
  name: string;
  plus: number;
  shiny: boolean;
}

export interface Lineage {
  parents: [LineageEntry, LineageEntry] | null;
  /** 親Aの親2体 + 親Bの親2体。親がガチャ産なら null */
  grandparents: (LineageEntry | null)[];
}

export type Origin = 'initial' | 'gacha' | 'synthesis' | 'exchange';

/** 所持している個体 */
export interface OwnedMonster {
  uid: string;
  monsterId: string;
  plus: number;
  shiny: boolean;
  obtainedAt: number;
  origin: Origin;
  lineage: Lineage;
}

export interface DexEntry {
  normal: boolean;
  shiny: boolean;
}

export interface DailyCounter {
  /** YYYY-MM-DD（端末ローカル） */
  date: string;
  freeUsed: number;
  adUsed: number;
}

export interface PlayerState {
  points: number;
  daily: DailyCounter;
  dex: Record<string, DexEntry>;
  discoveredRecipes: string[];
}
