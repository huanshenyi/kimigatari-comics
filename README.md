# キミガタリコミックス (Kimigatari Comics)

AIを活用した白黒マンガ自動生成Webアプリケーション

## 概要

**キミガタリコミックス**は、プロットと素材（キャラクター画像等）を入力として、AIが白黒マンガを自動生成し、ユーザーが編集・修正できるWebアプリケーションです。

### 主要機能

- **プロット入力**: 小説一話分相当のテキストを入力
- **素材管理**: キャラクター画像、背景素材のアップロード・管理
- **AI生成**: プロットからシーン分割→コマ割り→画像生成→テキスト配置
- **マンガエディタ**: 吹き出し編集、コマ調整、テキスト修正
- **エクスポート**: PNG/PDF出力

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| モノレポ | Turborepo + pnpm |
| フロントエンド | Next.js 16 (App Router), React 19, TypeScript |
| UI | shadcn/ui, Tailwind CSS |
| バックエンド | Hono |
| AIフレームワーク | Mastra |
| AI基盤 | Amazon Bedrock (Claude, Nova Canvas) |
| データベース | Supabase (PostgreSQL) + Drizzle ORM |
| ストレージ | AWS S3 (本番) / MinIO (開発) |

## クイックスタート

```bash
# 依存関係のインストール
pnpm install

# ローカルDB起動
supabase start

# MinIO起動
docker-compose up -d

# マイグレーション実行
cd packages/db && pnpm db:push && cd ../..

# 開発サーバー起動
pnpm dev
```

- フロントエンド: http://localhost:3000
- バックエンド: http://localhost:4111
- Supabase Studio: http://localhost:54323
- MinIO Console: http://localhost:9001

## プロジェクト構成

```
kimigatari-comics/
├── apps/
│   ├── web/                    # Next.js フロントエンド
│   └── api/                    # Hono + Mastra バックエンド
├── packages/
│   ├── types/                  # 共有型定義
│   ├── db/                     # Drizzle ORM・スキーマ
│   ├── storage/                # S3/MinIOクライアント
│   └── typescript-config/      # TypeScript設定
├── docs/                       # ドキュメント
├── supabase/                   # Supabase CLI設定
├── docker-compose.yml          # MinIO設定
└── turbo.json                  # Turborepo設定
```

## ドキュメント

- [セットアップガイド](./docs/setup.md)
- [APIエンドポイント](./docs/api.md)
- [開発コマンド](./docs/commands.md)
- [素材管理](./docs/assets.md)

## ライセンス

MIT
