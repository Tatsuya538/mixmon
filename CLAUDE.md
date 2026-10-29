# CLAUDE.md

AIのみで開発・保守するプロジェクト。README.md に構成とルールがある。

## 守ること
- ゲームロジックは `src/domain/` に純粋関数で書く（React・IndexedDB・`Math.random`・`Date.now` を直接使わない。`Rng` と `now` を引数で受け取る）。
- 画面から状態を変えるときは `src/store/gameStore.ts` のアクション経由。保存は `Changes` を `GameRepository.commit` に渡す1回だけ。
- ロジックを変えたら `tests/` にテストを追加。確率は `sequenceRng` で境界値を、`seededRng` で分布を検証する。
- 数値（排出率・価格・確率）は各 domain ファイル先頭の定数を唯一の出典にし、UIに直書きしない。
- マスターデータは `scripts/generate-monsters.ts` が正本。JSON を直接編集せず、スクリプトを直して `npm run gen:data` → `npm test`（データ整合性・全体到達可能性のテストが走る）。
- モンスター画像を受け取ったら `src/assets/monsters/<ID>.png`（色違いは `<ID>_shiny.png`）に置く。大きい画像は512px程度・webp に圧縮してから置く（Artifact は1ファイル16MB上限）。
- セーブデータの形を変えたら `src/storage/migrations.ts` の `SAVE_VERSION` を上げて移行処理を書く。
- 変更後は `npm run format && npm run build && npm test && npm run test:e2e` を通し、スクリーンショットで 390×844 の崩れを確認する。
- 公開中の Artifact を更新するときは `npm run build:artifact` → `artifact/mixmon.html` を再公開する。
- 既存ゲームのモンスター名・デザインに似せない。
