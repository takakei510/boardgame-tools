# 🎲 BoardGame Tools

**BoardGame Tools** は、ボードゲームをより快適に遊ぶためのWebツール集です。

現在は **ワードッチ (Wordocchi)** のサポートツールを開発中で、今後はオンラインプレイ機能や他のボードゲームにも対応予定です。

---

## ✨ 現在の機能

### ワードッチ

- ランダムなお題表示
- お題履歴（最新5件）
- お題のコピー
- 初期ワード候補を3つ表示
- お題・候補の重複防止

---

## 🚧 開発予定

### ワードッチ

- [ ] オンライン対戦
- [ ] 部屋作成・参加
- [ ] 親・子画面
- [ ] リアルタイム同期（Supabase）

### 今後対応予定

- [ ] ito
- [ ] コードネーム
- [ ] Just One
- [ ] その他ボードゲーム

---

## 🏗️ プロジェクト構成

```text
app/
├── page.tsx
├── wordocchi/
│   ├── page.tsx
│   └── room/
├── components/
├── data/
└── docs/
```

---

## 📚 ドキュメント

- Architecture
- Database Design
- State Flow

（docsフォルダを参照）

---

## 🚀 開発

### 開発サーバー

```bash
npm install
npm run dev
```

### 本番ビルド

```bash
npm run build
npm run start
```

---

## 🛠️ 使用技術

- Next.js
- React
- TypeScript
- Tailwind CSS
- Vercel

（予定）
- Supabase
- PostgreSQL

---

## 🎯 プロジェクトの目標

ボードゲームをブラウザだけで快適に遊べるツール集を作ること。

ローカルでの補助ツールだけでなく、オンラインでも利用できるリアルタイムゲーム環境を目指しています。