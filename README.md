boardgame-tools

ボードゲーム向けの小さなユーティリティをまとめた Next.js アプリケーションです。現在はワードゲーム支援ツール Wordocchi を中心に、トピック生成とオンラインプレイ用の導線を提供しています。

## Features

- トップページから各ツールへすぐ移動できるランチャー
- Wordocchi のお題ジェネレーター
- お題のコピー、履歴表示、再シャッフル
- オンラインプレイ向けのルーム画面
- トピックとワードのデータを分離管理

## Routes

- `/` : プロジェクトのトップページ
- `/wordocchi` : Wordocchi のお題ジェネレーター
- `/wordocchi/room` : オンラインプレイ用ルーム画面

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- ESLint

## Getting Started

```bash
npm install
npm run dev
```

開発サーバーを起動したら、ブラウザで `http://localhost:3000` を開いてください。保存時にホットリロードが反映されます。

## Build

```bash
npm run build
npm run start
```

## Project Structure

- `app/` : アプリケーションルートとページ
- `app/wordocchi/page.tsx` : Wordocchi のメイン UI
- `app/wordocchi/room/page.tsx` : ルーム画面
- `data/wordocchiTopics.ts` : Wordocchi 用トピック定義
- `data/wordocchiWords.json` : 初期ワード候補
- `data/wordocchiTopics.json` : トピック一覧の静的データ
- `public/` : 静的アセット

## Contributing

Issue でバグ報告や提案を受け付けています。小さな修正や改善提案の Pull Request も歓迎します。

## Development Notes

- ページの見た目や挙動を変える場合は `app/` を編集してください。
- Wordocchi の出題内容を更新する場合は `data/` 配下のデータを更新してください。
- ルーム画面は現在 UI 中心の実装です。今後の拡張に合わせて機能説明を追記できます。

## Reference

- Next.js Documentation: https://nextjs.org/docs
