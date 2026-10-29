import { ELEMENT_COLOR } from '../domain/labels';
import type { Element, Monster } from '../domain/types';

/**
 * 仮のモンスター画像（属性色のプレースホルダーSVG）。src/assets/monsters/ に画像が無いモンスターに使う。
 * シェア画像の描画にも使うため文字列で生成する。
 */
const SHINY_COLOR: Record<Element, string> = {
  fire: '#5fe0c0',
  water: '#ff8fd0',
  thunder: '#b8f06a',
  forest: '#ffb45a',
  shadow: '#ffe066',
};
const SILHOUETTE = '#3b3370';

function sparkle(x: number, y: number, r: number): string {
  return `<path d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r}Z" fill="#ffd24a"/>`;
}

export interface MonsterSvgOptions {
  monster: Pick<Monster, 'element' | 'rank' | 'no'>;
  shiny?: boolean;
  silhouette?: boolean;
  sparkles?: boolean;
}

export function monsterSvg({
  monster,
  shiny = false,
  silhouette = false,
  sparkles = shiny,
}: MonsterSvgOptions): string {
  const palette = shiny ? SHINY_COLOR : ELEMENT_COLOR;
  const body = silhouette ? SILHOUETTE : palette[monster.element];
  const high = monster.rank !== 'N' && monster.rank !== 'R';
  const legend = monster.rank === 'UR' || monster.rank === 'LR';
  // 図鑑番号で耳の形を少し変える
  const earTilt = (monster.no % 3) * 4;
  const parts: string[] = [];
  if (high) {
    parts.push(
      `<path d="M22 58 L6 40 L10 66 Z M78 58 L94 40 L90 66 Z" fill="${body}" opacity="${silhouette ? 1 : 0.75}"/>`,
    );
  }
  parts.push(
    `<path d="M${28 - earTilt / 2} 44 L${24 - earTilt} ${high ? 14 : 22} L44 34 Z M${72 + earTilt / 2} 44 L${76 + earTilt} ${high ? 14 : 22} L56 34 Z" fill="${body}"/>`,
    `<path d="M20 68 C20 44 33 32 50 32 C67 32 80 44 80 68 C80 82 70 86 50 86 C30 86 20 82 20 68 Z" fill="${body}"/>`,
  );
  if (legend && !silhouette) parts.push(`<path d="M38 26 L42 18 L50 24 L58 18 L62 26 Z" fill="#ffd24a"/>`);
  if (!silhouette) {
    parts.push(
      `<circle cx="41" cy="60" r="6" fill="#fff"/><circle cx="59" cy="60" r="6" fill="#fff"/>`,
      `<circle cx="41.5" cy="60.5" r="3" fill="#1b1633"/><circle cx="59.5" cy="60.5" r="3" fill="#1b1633"/>`,
    );
    if (high)
      parts.push(
        `<path d="M44 72 Q50 77 56 72" stroke="#1b1633" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
      );
    if (sparkles) parts.push(sparkle(84, 22, 7), sparkle(14, 30, 4.5), sparkle(86, 80, 4.5));
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${parts.join('')}</svg>`;
}

/** 本番画像の上に重ねるキラキラ */
export const SPARKLES_DATA_URI = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${sparkle(84, 22, 7)}${sparkle(14, 30, 4.5)}${sparkle(86, 80, 4.5)}</svg>`,
)}`;

export function monsterSvgDataUri(opts: MonsterSvgOptions): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(monsterSvg(opts))}`;
}
