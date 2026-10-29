import { expect, test, type Page } from '@playwright/test';

/** 横スクロールが発生していないこと（390px幅で崩れていないこと） */
async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const els = [document.documentElement, ...document.querySelectorAll<HTMLElement>('.page')];
    return els.some((el) => el.scrollWidth > el.clientWidth + 1);
  });
  expect(overflow).toBe(false);
}

function nav(page: Page, label: string) {
  return page.locator('.bottom-nav').getByRole('link', { name: label, exact: true }).click();
}

async function shot(page: Page, name: string) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(700); // 登場アニメーションを待つ
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: `test-results/screens/${name}.png` });
}

test('主要画面を一通り操作できる（390×844）', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('図鑑達成率')).toBeVisible();
  await shot(page, '01-home');

  // 合成
  await nav(page, '合成');
  await shot(page, '02-synthesis-empty');
  await page.getByRole('button', { name: '親Aを選ぶ' }).click();
  await shot(page, '03-parent-select');
  await page.getByRole('button', { name: /ヒノコロ/ }).click();
  // 片方だけ選んだ状態でも親カードの高さがそろっている
  const heights = await page
    .locator('.parent-card')
    .evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
  expect(heights[0]).toBeCloseTo(heights[1], 0);
  await page.getByRole('button', { name: '親Bを選ぶ' }).click();
  await page.getByRole('button', { name: /ミズプル/ }).click();
  await shot(page, '04-synthesis-ready');
  await page.getByRole('button', { name: '広告を見てヒントをもらう' }).click();
  await expect(page.getByText('この組み合わせは未発見のレシピかも…！')).toBeVisible();
  await page.getByRole('button', { name: '合成する' }).click();
  await expect(page.getByText('家系図')).toBeVisible();
  await expect(page.getByText('特殊合成成功！')).toBeVisible();
  await expect(page.getByText('「火と水が出会い湯気の竜に」')).toBeVisible();
  await shot(page, '05-synthesis-result');
  await page.getByRole('button', { name: '続けて合成' }).click();

  // ガチャ
  await nav(page, 'ガチャ');
  await shot(page, '06-gacha');
  await page.getByRole('button', { name: /無料で回す/ }).click();
  await expect(page.getByText('ガチャ結果')).toBeVisible();
  await shot(page, '07-gacha-result');
  await page.getByRole('button', { name: 'OK' }).click();
  await expect(page.getByRole('button', { name: /無料で回す/ })).toBeDisabled();
  await page.getByRole('button', { name: /10連ガチャ/ }).click();
  await page.getByRole('button', { name: '購入する' }).click();
  await expect(page.getByText('10連ガチャ結果')).toBeVisible();
  await shot(page, '08-gacha-10');
  await page.getByRole('button', { name: 'OK' }).click();
  await page.getByRole('link', { name: '詳細を見る' }).click();
  await shot(page, '09-gacha-rates');
  await page.getByRole('button', { name: '戻る' }).click();

  // 図鑑
  await nav(page, '図鑑');
  await shot(page, '10-dex');
  await page.locator('.dex-tile', { hasText: '？？？' }).first().click();
  await page.getByRole('button', { name: '広告を見てヒントを見る' }).click();
  await expect(page.locator('.dex-hint')).toBeVisible();
  await shot(page, '11-dex-hint');
  await page.getByRole('button', { name: '閉じる' }).click();
  await page.getByRole('button', { name: /色違い \d+\/80/ }).click();
  await shot(page, '12-dex-shiny');

  // 交換所
  await nav(page, '交換所');
  await page.getByRole('button', { name: 'ダブりを一括選択' }).click();
  await shot(page, '13-exchange-sell');
  await page.getByRole('button', { name: '売却する' }).click();
  await page.getByRole('button', { name: '売却', exact: true }).click();
  await expect(page.getByText(/pt を手に入れた/)).toBeVisible();
  await page.getByRole('button', { name: '指名交換' }).click();
  await shot(page, '14-exchange-buy');

  // 所持一覧 → 詳細
  await nav(page, 'ホーム');
  await expect(page.getByText('最近生まれたモンスター')).toBeVisible();
  await shot(page, '15-home-after');
  await page.getByRole('link', { name: /所持モンスター一覧/ }).click();
  await page.locator('.mon-tile').first().click();
  await shot(page, '16-monster-detail');

  // リロードしても保存されている
  await page.reload();
  await nav(page, 'ホーム');
  await expect(page.getByText('最近生まれたモンスター')).toBeVisible();
  await expect(page.locator('.recent-item')).toHaveCount(1);
});
