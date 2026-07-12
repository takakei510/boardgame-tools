boardgame-tools

これは Next.js で作成されたプロジェクトです。本リポジトリは「ボードゲーム向けユーティリティ」の集合体で、現在は主にワードゲーム支援ツール（Wordocchi）を含んでいます。

**目的**
- **用途:** ローカルでボードゲーム関連のツールを開発・共有するための小さなユーティリティ集。
- **主な機能:** トピック一覧生成や表示（`app/wordocchi`）、トピックデータ管理（`data/wordocchiTopics.ts`）、静的アセット（`public/`）など。

**構成（主なファイル／フォルダ）**
- `app/` : Next.js のアプリケーションルート。ページやレイアウトを含みます。
- `app/wordocchi/page.tsx` : Wordocchi の UI エントリポイント。
- `data/wordocchiTopics.ts` : ワードゲーム用トピックデータ。
- `public/` : 画像や静的ファイル。
- `package.json`, `tsconfig.json` など：プロジェクト設定。

## 開発（ローカル実行）

開発サーバーを起動するには、まず依存をインストールしてから開発コマンドを実行してください。

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:3000` を開くとアプリが表示されます。編集を保存するとホットリロードで自動更新されます。

## ビルドと起動（本番向け）

```bash
npm run build
npm run start
```

## 推奨環境
- Node.js 16 以上（プロジェクトの `engines` が指定されている場合はそれに従ってください）

## 開発のヒント
- 既存ページを編集する場合は `app/` 以下を直接編集してください。
- トピックデータを更新する場合は `data/wordocchiTopics.ts` を編集すると、UI に反映されます。

## 貢献
- バグ報告や機能提案は Issue を作成してください。簡単な修正なら Pull Request を歓迎します。

## 参考
- Next.js ドキュメント: https://nextjs.org/docs

---
（元テンプレートの英文説明は削除し、プロジェクト固有の説明に差し替えました）
