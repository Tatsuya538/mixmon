# モンスター画像

ここに画像を置くと、ビルド時に自動で取り込まれます（コードの変更は不要）。

- ファイル名は `src/data/monsters.json` の `imagePath` と同じにする（例: `m001.png`）
- 色違い画像は `_shiny` を付ける（例: `m001_shiny.png`）。無ければ通常画像の色相をずらして表示
- 対応形式: png / webp / jpg / svg（拡張子を変える場合は `scripts/generate-monsters.ts` の imagePath も合わせる）
- 推奨: 正方形・背景透過・512×512 程度・1枚 100KB 以下（webp 推奨）
- 画像が無いモンスターは属性色の仮SVGで表示される
