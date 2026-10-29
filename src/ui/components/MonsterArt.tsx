import { useMemo, type CSSProperties } from 'react';
import type { Monster } from '../../domain/types';
import { monsterImage } from '../monsterImages';
import { monsterSvgDataUri, SPARKLES_DATA_URI } from '../monsterSvg';

interface Props {
  monster: Monster;
  shiny?: boolean;
  silhouette?: boolean;
  sparkles?: boolean;
  /** 数値は px。文字列（例: '78%'）は幅として扱い、正方形にする */
  size?: number | string;
}

/** モンスター画像。src/assets/monsters/ に画像があればそれを、無ければ仮SVGを表示する */
export function MonsterArt({ monster, shiny = false, silhouette = false, sparkles = shiny, size = 64 }: Props) {
  const image = silhouette ? monsterImage(monster, false) : monsterImage(monster, shiny);
  const fallback = useMemo(
    () => (image ? undefined : monsterSvgDataUri({ monster, shiny, silhouette, sparkles })),
    [image, monster, shiny, silhouette, sparkles],
  );
  const box: CSSProperties = typeof size === 'number' ? { width: size, height: size } : { width: size };
  const label = silhouette ? '未発見' : monster.name;

  if (!image) {
    return (
      <span className="mon-art" style={box}>
        <img src={fallback} alt={label} draggable={false} />
      </span>
    );
  }
  if (silhouette) {
    // 画像の形だけを切り抜いて塗る
    const mask = `url("${image.src}") center / contain no-repeat`;
    return (
      <span className="mon-art" style={box} role="img" aria-label={label}>
        <span className="mon-art-silhouette" style={{ WebkitMask: mask, mask }} />
      </span>
    );
  }
  return (
    <span className="mon-art" style={box}>
      <img src={image.src} alt={label} style={image.filter ? { filter: image.filter } : undefined} draggable={false} />
      {sparkles && <img src={SPARKLES_DATA_URI} alt="" className="mon-art-sparkles" draggable={false} />}
    </span>
  );
}
