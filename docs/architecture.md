# BoardGame Tools 設計書

## 概要

BoardGame Tools は、ボードゲームをオンライン・オフライン問わず遊ぶためのWebアプリケーションである。

現在実装予定

- ワードッチ
- ito（予定）
- その他ボードゲーム（予定）

---

# システム構成

```mermaid
flowchart TD
    A[BoardGame Tools] --> B[ローカルプレイ]
    A --> C[オンラインプレイ]

    B --> D[ワードッチ お題ジェネレーター]

    C --> E[部屋作成・参加]
    E --> F[待機画面]
    F --> G[ゲーム開始]

    G --> H[親画面]
    G --> I[子画面]

    H --> J[初期ワード選択]
    J --> K[回答入力]

    I --> K

    K --> L[親が比較]
    L --> M[現在ワード更新]
    M --> K

    L --> N[ゲーム終了]
```

---

# ディレクトリ構成

```text
app
├── page.tsx
├── wordocchi
│   ├── page.tsx
│   └── room
│       └── page.tsx
│
├── ito
│
└── components
```

---

# 今後追加予定

- Supabase
- 部屋機能
- リアルタイム同期
- PWA