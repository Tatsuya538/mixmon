/**
 * モンスター画像の登録。src/assets/monsters/ に置いたファイルをビルド時に自動で取り込む。
 * monster.imagePath（例: monsters/m001.png）で引き、色違いは monsters/m001_shiny.png。
 */
import type { Monster } from '../domain/types';

const files = import.meta.glob<string>('../assets/monsters/*.{png,webp,jpg,jpeg,svg}', {
  eager: true,
  import: 'default',
});

/** imagePath（monsters/xxx.png）→ 表示用URL */
export const MONSTER_IMAGES: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.replace('../assets/', ''), url]),
);

/** 色違い画像が無いときに通常画像へかける色変換 */
export const SHINY_FILTER = 'hue-rotate(150deg) saturate(1.2)';

export function shinyPathOf(imagePath: string): string {
  return imagePath.replace(/(\.[a-z]+)$/i, '_shiny$1');
}

export interface MonsterImage {
  src: string;
  /** CSS / canvas の filter。色違い画像が無い場合のみ */
  filter?: string;
}

/** 登録済みの画像。無ければ undefined（呼び出し側で仮SVGを使う） */
export function monsterImage(monster: Pick<Monster, 'imagePath'>, shiny: boolean): MonsterImage | undefined {
  if (shiny) {
    const own = MONSTER_IMAGES[shinyPathOf(monster.imagePath)];
    if (own) return { src: own };
  }
  const normal = MONSTER_IMAGES[monster.imagePath];
  if (!normal) return undefined;
  return shiny ? { src: normal, filter: SHINY_FILTER } : { src: normal };
}
