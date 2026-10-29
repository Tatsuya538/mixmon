# ミクスモン（仮）

モンスター合成・図鑑コンプ系のスマホ向けゲーム（PWA）。第1弾はオフライン完結（サーバー・ログインなし）。

## コマンド

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー |
| `npm test` | ユニットテスト（合成・ガチャ・交換所・データ整合性・ストレージ） |
| `npm run test:e2e` | 390×844 で全画面を操作し、`test-results/screens/` にスクリーンショットを出力 |
| `npm run build` | 型チェック＋本番ビルド（`dist/`、PWA対応） |
| `npm run gen:data` | `scripts/generate-monsters.ts` から `src/data/*.json` を再生成 |
| `npm run build:artifact` | claude.ai の Artifact 用に1つのHTML（`artifact/mixmon.html`）を生成 |
| `npm run format` | Prettier で整形 |

## 構成

```
src/
  domain/    ゲームロジック（React・IndexedDB 非依存の純粋関数）
    synthesis.ts  合成（属性合成・特殊合成・＋値・色違い・家系図）
    gacha.ts      ガチャ抽選・排出率・日次回数
    exchange.ts   売却・指名交換・ダブり選択
    dex.ts        図鑑登録・達成率・ヒント
    game.ts       ゲーム操作（状態 → 保存すべき変更 Changes を返す）
    rng.ts        乱数（テストでは seededRng / sequenceRng に差し替え）
  data/      monsters.json（80体）/ recipes.json（12件）
  storage/   GameRepository（抽象）/ IndexedDbRepository / MemoryRepository / migrations
  services/  AdService / PurchaseService / ShareService（広告・課金はモック）
  store/     Zustand。domain を呼び、Changes を repository に保存
  ui/        画面（screens）と部品（components）、仮モンスターSVG（monsterSvg.ts）
tests/       ユニットテスト（Vitest）
e2e/         画面テスト（Playwright）
```

## ゲームルールの実装メモ

モンスター一覧・属性合成表・レシピは `scripts/generate-monsters.ts` が正本（`npm run gen:data` で `src/data/*.json` を生成）。

- **モンスター**: 全80体・すべて単属性。★（ユゲドラ・ヒョウガミ・UR7体・LR3体）は特殊合成でのみ誕生。
- **属性合成**: 子の属性は属性合成表（`src/data/elementTable.json`）で決定。ランクは親の高い方（UR/LR親はSR扱い）、30%で1ランク上（上限SR）。
  モンスターは「その属性×ランクの候補（★除く・ID順）」のうち（親AのID番号＋親BのID番号）÷候補数 の余り番目（0始まり）。同じ組み合わせなら毎回同じ結果。
- **特殊合成**: `recipes.json` の12レシピ（親は順不同）が属性合成より優先。合成結果画面にストーリーを表示。
- **＋値**: 親A + 親B + 1。表示と家系図のみ（ステータスには反映しない）。
- **色違い**: 片親が色違い→確定／両親→確定＋特別演出／通常同士 0.1%（特殊合成でも同じ）。
- **ガチャ**: N30体＋R24体（ユゲドラ除く）。N 85% / R 15%、色違い別枠0.2%。無料1日1回＋広告1日3回（端末ローカルの0時リセット）。
- **交換所**: 売却 N=1pt / R=5pt（SR以上不可）、指名交換 N=10pt / R=50pt（ガチャ対象と同じ54体）。
- **初期所持**: 各属性のNをID順に2体ずつ（ヒノコロ×ミズプルですぐ特殊合成を体験できる）。
- 無課金で全80体に到達できることを `tests/data.test.ts` で検証済み。

## モンスター画像の登録

`src/assets/monsters/` に `m001.png` のように **ID をファイル名にして置くだけ**（コード変更不要）。

- 色違い画像は `m001_shiny.png`。無ければ通常画像の色相をずらして表示
- 未発見のシルエットは画像の形から自動で作る
- 画像が無いモンスターは属性色の仮SVG
- png 以外（webp 等）にする場合は `scripts/generate-monsters.ts` の imagePath の拡張子も変えて `npm run gen:data`
- `npm test` でファイル名の打ち間違い（どのモンスターにも当たらない画像）を検出する

## 差し替えポイント

| 対象 | 場所 |
|---|---|
| 名前・ステータス・レシピ・属性合成表 | `scripts/generate-monsters.ts` を編集して `npm run gen:data`（データテストが整合性と全体到達を確認） |
| 広告SDK・課金 | `src/services/index.ts` の実装を差し替え |
| サーバー移行 | `GameRepository` の API 実装を作り `src/store/gameStore.ts` の `deps.repo` を差し替え |
| 10連の価格 | `MockPurchaseService.getProducts()`（本番はストアから取得） |

## iPhone で遊ぶ（PWA）

`main` に push すると GitHub Actions（`.github/workflows/deploy.yml`）がテスト・ビルドして GitHub Pages に公開する。

1. iPhone の Safari で公開URLを開く
2. 共有ボタン →「ホーム画面に追加」
3. ホーム画面のアイコンから全画面で起動（一度開けばオフラインでも動く）

- アイコンは `public/icon.svg` を編集して `npm run gen:icons` で PNG を作り直す
- データは端末内（Safari のホーム画面アプリごと）に保存される。アプリを削除するとデータも消える

## Capacitor で iOS / Android 化する手順

`vite.config.ts` は `base: './'`、ルーティングは HashRouter なので、そのままネイティブのWebViewで動作します。

```sh
npm i @capacitor/core && npm i -D @capacitor/cli
npx cap init ミクスモン com.example.mixmon --web-dir dist
npm i @capacitor/ios @capacitor/android
npm run build && npx cap add ios && npx cap add android
npx cap sync   # ビルドのたびに実行
```

- ネイティブでは Service Worker が不要なため、必要なら PWA 登録をネイティブ時だけ無効化する。
- IndexedDB は WebView 内に保存される。消える可能性が気になる場合は `@capacitor/preferences` や SQLite を使う `GameRepository` 実装を追加する。
