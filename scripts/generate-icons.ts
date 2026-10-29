/**
 * public/icon.svg から PNG アイコンを生成する（iOS のホーム画面は SVG アイコン非対応のため）。
 * `npm run gen:icons`。角の透過は iOS で黒く出るので、背景色で塗りつぶした正方形にする。
 */
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const svg = readFileSync('public/icon.svg', 'utf8');
const SIZES: [string, number][] = [
  ['public/apple-touch-icon.png', 180],
  ['public/icon-192.png', 192],
  ['public/icon-512.png', 512],
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [path, size] of SIZES) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<body style="margin:0;background:#1b1633"><div style="width:${size}px;height:${size}px">${svg.replace('<svg ', '<svg width="100%" height="100%" ')}</div></body>`,
  );
  await page.screenshot({ path, omitBackground: false });
  console.log(path);
}
await browser.close();
