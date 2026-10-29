/**
 * Artifact（claude.ai の共有ページ）用に、ビルド結果を1つのHTMLにまとめる。
 * `npm run build:artifact` → artifact/mixmon.html
 * Artifact は外部スクリプト・Service Worker が使えないため JS/CSS をインライン化し、フォントは Google Fonts を使う。
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

const dir = 'dist-artifact/assets';
const files = readdirSync(dir);
const read = (ext: string) => {
  const f = files.filter((x) => x.endsWith(ext));
  if (f.length !== 1) throw new Error(`${ext} が1つではない: ${f.join(', ')}`);
  return readFileSync(`${dir}/${f[0]}`, 'utf8');
};
const css = read('.css');
// インラインの <script> を途中で閉じないようにする
const js = read('.js').replace(/<\/script/gi, '<\\/script');

const html = `<title>ミクスモン</title>
<meta name="theme-color" content="#1b1633">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=M+PLUS+Rounded+1c:wght@700;800&display=swap">
<style>
${css}
/* Artifact の外枠が :root に safe-area 分の余白を付けるため、ページ側の上余白は通常値に戻す */
.page { padding-top: 20px; }
</style>
<div id="root"></div>
<script type="module">
${js}
</script>
`;
mkdirSync('artifact', { recursive: true });
writeFileSync('artifact/mixmon.html', html);
const kb = Math.round(Buffer.byteLength(html) / 1024);
console.log(`artifact/mixmon.html (${kb} KB)`);
// Artifact の上限は 16MB。画像を増やして超えそうなら webp 化・縮小する
if (kb > 15 * 1024) throw new Error('Artifact の上限（16MB）に近い。モンスター画像を圧縮してください');
