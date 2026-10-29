import { describe, expect, it } from 'vitest';
import { MONSTER_IMAGES, monsterImage, shinyPathOf } from '../src/ui/monsterImages';
import { catalog } from './helpers';

describe('モンスター画像', () => {
  it('src/assets/monsters/ の画像はすべてモンスターの imagePath（または色違い版）と一致する（ファイル名の打ち間違い検出）', () => {
    const known = new Set(catalog.monsters.flatMap((m) => [m.imagePath, shinyPathOf(m.imagePath)]));
    expect(Object.keys(MONSTER_IMAGES).filter((p) => !known.has(p))).toEqual([]);
  });

  it('色違い画像のパス', () => {
    expect(shinyPathOf('monsters/m001.png')).toBe('monsters/m001_shiny.png');
    expect(shinyPathOf('monsters/m001.webp')).toBe('monsters/m001_shiny.webp');
  });

  it('画像が無いモンスターは undefined（仮SVGで表示）', () => {
    expect(monsterImage({ imagePath: 'monsters/not-exist.png' }, false)).toBeUndefined();
  });
});
