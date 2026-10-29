/**
 * マスターデータ生成スクリプト。`npm run gen:data` で src/data/*.json を上書きする。
 * 名前・ランク・属性・レシピは「モンスター一覧と合成パターン」の仕様どおり。
 * ステータスは仮（シード固定なので何度実行しても同じ結果になる）。
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ELEMENTS, type Element, type ElementTable, type Monster, type Rank, type Recipe } from '../src/domain/types';
import { seededRng } from '../src/domain/rng';

/** ★ = 特殊合成でのみ誕生 */
const STAR = '★';

/** ランクごとに、属性（炎・水・雷・森・影）の順で ID が連番になる */
const BY_RANK: { rank: Rank; names: Record<Element, string[]> }[] = [
  {
    rank: 'N',
    names: {
      fire: ['ヒノコロ', 'ホムラン', 'カエンボ', 'ヒバチン', 'タキビー', 'コゲタン'],
      water: ['ミズプル', 'シズクン', 'アワポン', 'ナミコ', 'カッパチ', 'ウオルン'],
      thunder: ['ビリット', 'ピリリ', 'デンキュー', 'ゴロッチ', 'スパッキー', 'ネオンボ'],
      forest: ['モリプル', 'ハッパン', 'キノボウ', 'ツタロウ', 'ドングリン', 'コケマル'],
      shadow: ['カゲモン', 'ヨルピヨ', 'ドクロン', 'ヤミネコ', 'クロウル', 'モヤット'],
    },
  },
  {
    rank: 'R',
    names: {
      fire: ['フレイガル', 'ヨウガンボ', 'ヒエンジャ', 'バーニャ', 'ネッパード'],
      water: ['ユゲドラ★', 'アクアレス', 'タイドン', 'サザナギ', 'クラゲール'],
      thunder: ['ボルトガ', 'イナズマル', 'サンダリオ', 'プラズマン', 'ゴロゴン'],
      forest: ['ウッドラ', 'フラワン', 'ジュモック', 'モスキバ', 'ツルギソウ'],
      shadow: ['シャドウガ', 'ノクターン', 'ジゴクン', 'ガイコツキ', 'ヨミガラス'],
    },
  },
  {
    rank: 'SR',
    names: {
      fire: ['ヴォルガイア', 'フレアドレイク', 'グレンオー'],
      water: ['リヴァイアン', 'オーシャルク', 'ヒョウガミ★'],
      thunder: ['ライメイオー', 'テンペスター', 'ボルテクス'],
      forest: ['ユグドラン', 'ガイアモス', 'シンリンオー'],
      shadow: ['ヤミノオウ', 'ネクロード', 'ルナリス'],
    },
  },
];

/** UR・LR は属性順ではなく一覧の順 */
const TOP: { name: string; rank: Rank; element: Element }[] = [
  { name: 'ソルガルーダ★', rank: 'UR', element: 'fire' },
  { name: 'ウズマキリュウ★', rank: 'UR', element: 'water' },
  { name: 'ガイアテラ★', rank: 'UR', element: 'forest' },
  { name: 'ライジュウオー★', rank: 'UR', element: 'thunder' },
  { name: 'ヨミクイーン★', rank: 'UR', element: 'shadow' },
  { name: 'メテオドラ★', rank: 'UR', element: 'fire' },
  { name: 'ゲンムオウ★', rank: 'UR', element: 'shadow' },
  { name: 'アルカディオン★', rank: 'LR', element: 'thunder' },
  { name: 'エターナリス★', rank: 'LR', element: 'water' },
  { name: 'カオスノヴァ★', rank: 'LR', element: 'shadow' },
];

/** [結果, 親A, 親B, ストーリー] */
const RECIPES: [string, string, string, string][] = [
  ['ユゲドラ', 'ヒノコロ', 'ミズプル', '火と水が出会い湯気の竜に'],
  ['ヒョウガミ', 'ユゲドラ', 'ゴロゴン', '湯気と雷雲が雹を生む'],
  ['ソルガルーダ', 'グレンオー', 'テンペスター', '炎の王と嵐が太陽の鳥に'],
  ['ウズマキリュウ', 'リヴァイアン', 'フレアドレイク', '海竜と炎竜の大渦'],
  ['ガイアテラ', 'ユグドラン', 'オーシャルク', '大樹と大海が大地となる'],
  ['ライジュウオー', 'ボルテクス', 'シンリンオー', '森に落ちた雷の獣王'],
  ['ヨミクイーン', 'ネクロード', 'ヒョウガミ', '凍てつく冥界の女王'],
  ['メテオドラ', 'ヴォルガイア', 'ルナリス', '月に焼かれた流星竜'],
  ['ゲンムオウ', 'ガイアモス', 'ヤミノオウ', '夢と闇を操る王'],
  ['アルカディオン', 'ソルガルーダ', 'ガイアテラ', '天と地を統べる伝説'],
  ['エターナリス', 'ウズマキリュウ', 'ヨミクイーン', '永遠を巡る水の伝説'],
  ['カオスノヴァ', 'ライジュウオー', 'ゲンムオウ', '混沌から生まれた新星'],
];

/** 属性合成表（親の属性の組み合わせ → 子の属性）。対称な表 */
const ELEMENT_TABLE: ElementTable = {
  fire: { fire: 'fire', water: 'thunder', thunder: 'fire', forest: 'shadow', shadow: 'fire' },
  water: { fire: 'thunder', water: 'water', thunder: 'water', forest: 'forest', shadow: 'water' },
  thunder: { fire: 'fire', water: 'water', thunder: 'thunder', forest: 'forest', shadow: 'shadow' },
  forest: { fire: 'shadow', water: 'forest', thunder: 'forest', forest: 'forest', shadow: 'thunder' },
  shadow: { fire: 'fire', water: 'water', thunder: 'shadow', forest: 'thunder', shadow: 'shadow' },
};

const RANK_BASE: Record<Rank, number> = { N: 36, R: 48, SR: 64, UR: 86, LR: 110 };
/** 属性ごとの得意ステータス */
const TILT: Record<Element, { hp: number; atk: number; def: number; spd: number }> = {
  fire: { hp: 1, atk: 1.2, def: 0.9, spd: 1 },
  water: { hp: 1.1, atk: 0.9, def: 1.15, spd: 0.9 },
  thunder: { hp: 0.9, atk: 1.05, def: 0.9, spd: 1.25 },
  forest: { hp: 1.2, atk: 0.95, def: 1.05, spd: 0.85 },
  shadow: { hp: 0.95, atk: 1.1, def: 0.95, spd: 1.1 },
};

export function generate(): { monsters: Monster[]; recipes: Recipe[]; elementTable: ElementTable } {
  const slots: { name: string; rank: Rank; element: Element }[] = [];
  for (const { rank, names } of BY_RANK) {
    for (const element of ELEMENTS) for (const name of names[element]) slots.push({ name, rank, element });
  }
  slots.push(...TOP);

  const rng = seededRng(20261007);
  const jitter = () => 0.9 + rng.next() * 0.2;
  const monsters: Monster[] = slots.map((s, i) => {
    const no = i + 1;
    const id = `m${String(no).padStart(3, '0')}`;
    const star = s.name.endsWith(STAR);
    const base = RANK_BASE[s.rank];
    const t = TILT[s.element];
    return {
      id,
      no,
      name: star ? s.name.slice(0, -STAR.length) : s.name,
      rank: s.rank,
      element: s.element,
      hp: Math.round(base * t.hp * jitter()),
      atk: Math.round(base * 0.44 * t.atk * jitter()),
      def: Math.round(base * 0.34 * t.def * jitter()),
      spd: Math.round(base * 0.38 * t.spd * jitter()),
      imagePath: `monsters/${id}.png`,
      source: star ? 'recipe' : s.rank === 'N' || s.rank === 'R' ? 'gacha' : 'synthesis',
    };
  });

  const byName = new Map(monsters.map((m) => [m.name, m.id]));
  const idOf = (name: string) => {
    const id = byName.get(name);
    if (!id) throw new Error(`unknown monster name: ${name}`);
    return id;
  };
  const recipes: Recipe[] = RECIPES.map(([result, a, b, story], i) => ({
    id: `r${String(i + 1).padStart(2, '0')}`,
    parents: [idOf(a), idOf(b)],
    result: idOf(result),
    story,
  }));
  return { monsters, recipes, elementTable: ELEMENT_TABLE };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { monsters, recipes, elementTable } = generate();
  const dir = new URL('../src/data/', import.meta.url);
  writeFileSync(new URL('monsters.json', dir), JSON.stringify(monsters, null, 2) + '\n');
  writeFileSync(new URL('recipes.json', dir), JSON.stringify(recipes, null, 2) + '\n');
  writeFileSync(new URL('elementTable.json', dir), JSON.stringify(elementTable, null, 2) + '\n');
  console.log(`monsters: ${monsters.length}, recipes: ${recipes.length}`);
}
