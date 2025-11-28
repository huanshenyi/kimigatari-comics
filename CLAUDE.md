# CLAUDE.md - マンガ生成アプリ プロジェクトガイド

このファイルはClaude Codeがプロジェクトを理解するためのコンテキストを提供します。

## プロジェクト概要

**manga-generator** は、プロットと素材（キャラクター画像等）を入力として、AIを活用して白黒マンガを自動生成し、ユーザーが編集・修正できるWebアプリケーションです。

### 主要機能

1. **プロット入力**: 小説一話分相当のテキストを入力
2. **素材管理**: キャラクター画像、背景素材のアップロード・管理
3. **AI生成**: プロットからシーン分割→コマ割り→画像生成→テキスト配置
4. **マンガエディタ**: 吹き出し編集、コマ調整、テキスト修正
5. **エクスポート**: PNG/PDF出力

---

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| モノレポ | Turborepo + pnpm |
| フロントエンド | Next.js 15 (App Router), React 19, TypeScript |
| UI | shadcn/ui, Tailwind CSS |
| バックエンド | Hono |
| AIフレームワーク | Mastra |
| AI基盤 | Amazon Bedrock, Gemini Nanobanana pro (Claude, Nova Canvas) |
| データベース | Supabase (PostgreSQL) |
| 認証 | Supabase Auth |
| ストレージ | AWS S3 + CloudFront |
| Canvasライブラリ | Fabric.js |

---

## ディレクトリ構造

```
manga-generator/
├── apps/
│   ├── web/                    # Next.js フロントエンド
│   │   ├── app/
│   │   │   ├── (auth)/         # 認証関連ページ
│   │   │   ├── (dashboard)/    # メインアプリ
│   │   │   │   ├── projects/   # プロジェクト管理
│   │   │   │   └── assets/     # 素材管理
│   │   │   └── api/            # API Routes
│   │   ├── components/
│   │   │   ├── editor/         # マンガエディタ
│   │   │   ├── plot/           # プロット入力
│   │   │   └── assets/         # 素材管理UI
│   │   └── lib/
│   └── api/                    # Hono + Mastra バックエンド
│       └── src/
│           ├── agents/         # Mastra Agents
│           ├── workflows/      # Mastra Workflows
│           ├── tools/          # Mastra Tools
│           └── routes/         # API ルート
├── packages/
│   ├── types/                  # 共有型定義
│   ├── ui/                     # 共有UIコンポーネント
│   ├── db/                     # Supabase クライアント・クエリ
│   ├── canvas/                 # Fabric.js ユーティリティ
│   └── config/                 # 共有設定
│       ├── eslint/
│       ├── typescript/
│       └── tailwind/
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── TODO.md                     # 実装Todoリスト
└── CLAUDE.md                   # このファイル
```

---

## Mastra Agents

### 1. StoryAnalyzerAgent
- **目的**: プロットをシーンに分割
- **入力**: 小説形式のテキスト
- **出力**: シーン配列（場面説明、キャラクター、セリフ、感情指示）

### 2. PanelLayoutAgent
- **目的**: コマ割りレイアウト生成
- **入力**: シーン配列、ページ数
- **出力**: ページごとのコマ配置データ

### 3. ImageGeneratorAgent
- **目的**: コマ画像の生成
- **入力**: コマ情報、キャラクター参照画像、スタイル設定
- **出力**: 白黒マンガ画像
- **モデル**: Amazon Nova Canvas

### 4. TextPlacementAgent
- **目的**: 吹き出しとテキストの配置
- **入力**: レイアウト、画像、シーン情報
- **出力**: 吹き出し配置データ

---

## データモデル

### Project
```typescript
interface Project {
  id: string;
  userId: string;
  title: string;
  plot: string;
  status: 'draft' | 'generating' | 'completed' | 'error';
  createdAt: Date;
  updatedAt: Date;
}
```

### Character
```typescript
interface Character {
  id: string;
  projectId: string;
  name: string;
  description: string;
  referenceImages: string[];
  styleConfig: CharacterStyle;
}
```

### Page
```typescript
interface Page {
  id: string;
  projectId: string;
  pageNumber: number;
  layoutData: PanelLayout[];
}
```

### Panel
```typescript
interface Panel {
  id: string;
  pageId: string;
  panelOrder: number;
  position: { x: number; y: number; width: number; height: number };
  generatedImageUrl: string | null;
  elements: PanelElement[];
}
```

### SpeechBubble
```typescript
interface SpeechBubble {
  id: string;
  panelId: string;
  type: 'normal' | 'shout' | 'thought' | 'narration' | 'whisper';
  text: string;
  position: { x: number; y: number };
  tailDirection: 'left' | 'right' | 'top' | 'bottom' | 'none';
  style: BubbleStyle;
}
```

---

## コマンド

```bash
# 開発サーバー起動（全アプリ）
pnpm dev

# 特定アプリのみ起動
pnpm dev:web
pnpm dev:api

# ビルド
pnpm build

# 型チェック
pnpm type-check

# Lint
pnpm lint

# Supabase型生成
pnpm db:generate
```

---

## 環境変数

### apps/web/.env.local
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=
```

### apps/api/.env.local
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=
```

---

## 開発ガイドライン

### コーディング規約

- TypeScript strict mode 使用
- ESLint + Prettier でフォーマット
- コンポーネントは関数コンポーネント + Hooks
- 型は `packages/types` で一元管理
- APIレスポンスは必ず型定義

### Git コミット規約

```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント更新
style: フォーマット変更
refactor: リファクタリング
test: テスト追加・修正
chore: ビルド・設定変更
```

### ブランチ戦略

- `main`: 本番環境
- `develop`: 開発環境
- `feature/*`: 機能開発
- `fix/*`: バグ修正

---

## 実装時の注意点

1. **日本語マンガの読み順**: 右から左への読み順を考慮
2. **縦書きテキスト**: 吹き出し内は縦書きが基本
3. **キャラクター一貫性**: 同じキャラクターが異なるコマでも同じ見た目になるよう参照画像を活用
4. **白黒スタイル**: カラーではなく、線画+スクリーントーンの日本マンガスタイル
5. **パフォーマンス**: 画像生成は時間がかかるため、進捗表示とバックグラウンド処理を実装

---

## 参照リソース

- [TODO.md](./TODO.md) - 詳細な実装タスクリスト
- [Mastra Docs](https://mastra.ai/docs)
- [Amazon Bedrock](https://docs.aws.amazon.com/bedrock/)
- [Fabric.js Docs](http://fabricjs.com/docs/)
