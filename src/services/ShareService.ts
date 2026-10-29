import { elementText } from '../domain/labels';
import type { Monster, OwnedMonster } from '../domain/types';
import { monsterImage } from '../ui/monsterImages';
import { monsterSvgDataUri, SPARKLES_DATA_URI } from '../ui/monsterSvg';

/** preview: 共有できない環境。imageUrl を画面に表示して長押し保存してもらう */
export type ShareResult = { kind: 'shared' | 'cancelled' } | { kind: 'preview'; imageUrl: string };

export interface ShareInput {
  monster: Monster;
  owned: OwnedMonster;
}

export interface ShareService {
  shareMonster(input: ShareInput): Promise<ShareResult>;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** 誕生したモンスターのシェア画像（1080×1350）を描く */
export async function renderShareImage({ monster, owned }: ShareInput): Promise<Blob> {
  await document.fonts?.ready;
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const c = canvas.getContext('2d')!;
  c.fillStyle = '#1b1633';
  c.fillRect(0, 0, W, H);
  c.fillStyle = '#2a2350';
  c.beginPath();
  c.roundRect(140, 200, 800, 700, 80);
  c.fill();

  const image = monsterImage(monster, owned.shiny);
  const art = await loadImage(image?.src ?? monsterSvgDataUri({ monster, shiny: owned.shiny }));
  if (image?.filter) c.filter = image.filter;
  c.drawImage(art, 240, 250, 600, 600);
  c.filter = 'none';
  if (image && owned.shiny) c.drawImage(await loadImage(SPARKLES_DATA_URI), 240, 250, 600, 600);

  c.textAlign = 'center';
  c.fillStyle = '#f2b33d';
  c.font = '64px "Dela Gothic One"';
  c.fillText('ミクスモン', W / 2, 130);
  if (owned.shiny) {
    c.fillStyle = '#ffd24a';
    c.font = '800 44px "M PLUS Rounded 1c"';
    c.fillText('✦ 色違い ✦', W / 2, 990);
  }
  c.fillStyle = '#ffffff';
  c.font = '110px "Dela Gothic One"';
  c.fillText(monster.name, W / 2, 1120);

  // 「R 炎×水 +6」を1行で中央揃え（＋値だけアクセント色）
  c.font = '800 52px "M PLUS Rounded 1c"';
  c.textAlign = 'left';
  const head = `${monster.rank}  ${elementText(monster)}  `;
  const tail = `+${owned.plus}`;
  const x = (W - c.measureText(head + tail).width) / 2;
  c.fillStyle = '#c9c3ea';
  c.fillText(head, x, 1220);
  c.fillStyle = '#f2b33d';
  c.fillText(tail, x + c.measureText(head).width, 1220);

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('画像の生成に失敗しました'))), 'image/png'),
  );
}

/** Web Share API（ファイル共有）が使えれば共有、使えなければ画像を返して画面に表示する */
export class WebShareService implements ShareService {
  async shareMonster(input: ShareInput): Promise<ShareResult> {
    const blob = await renderShareImage(input);
    const file = new File([blob], `mixmon-${input.monster.id}.png`, { type: 'image/png' });
    const text = `${input.owned.shiny ? '色違いの' : ''}${input.monster.name}が生まれた！ #ミクスモン`;
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text });
        return { kind: 'shared' };
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return { kind: 'cancelled' };
        // 共有が拒否された環境（埋め込み表示など）は画像表示にフォールバック
      }
    }
    return { kind: 'preview', imageUrl: URL.createObjectURL(blob) };
  }
}
