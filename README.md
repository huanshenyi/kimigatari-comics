# 君語りコミックス (Kimigatari Comics)

AIを活用した白黒マンガ自動生成Webアプリケーション

## 概要

**君語りコミックス**は、プロットと素材（キャラクター画像等）を入力として、AIが白黒マンガを自動生成し、ユーザーが編集・修正できるWebアプリケーションです。

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
| ストレージ | AWS S3 (本番) / MinIO (開発) |

## セットアップ

### 前提条件

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose（ローカルストレージ用）

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd kimigatari-comics
```

### 2. 依存関係のインストール

```bash
pnpm install
```

### 3. 環境変数の設定

#### apps/web/.env.local

```env
NEXT_PUBLIC_API_URL=http://localhost:4111
```

#### apps/api/.env.local

```env
# AI設定
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key

# AWS Bedrock (本番環境)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key

# MinIO (ローカル開発) - docker-compose.ymlのデフォルト値
MINIO_ENDPOINT=http://localhost:9000
MINIO_BUCKET=kimigatari-assets
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
```

### 4. ローカルストレージ（MinIO）の起動

```bash
docker-compose up -d
```

MinIOコンソール: http://localhost:9001
- ユーザー名: `minioadmin`
- パスワード: `minioadmin`

### 5. 開発サーバーの起動

```bash
# 全アプリを起動
pnpm dev

# 個別に起動
pnpm dev:web    # フロントエンド (http://localhost:3000)
pnpm dev:api    # バックエンド (http://localhost:4111)
```

## プロジェクト構成

```
kimigatari-comics/
├── apps/
│   ├── web/                    # Next.js フロントエンド
│   │   ├── app/                # App Router ページ
│   │   ├── components/         # UIコンポーネント
│   │   │   ├── editor/         # マンガエディタ
│   │   │   ├── plot/           # プロット入力
│   │   │   └── assets/         # 素材管理UI
│   │   └── lib/                # ユーティリティ
│   └── api/                    # Hono + Mastra バックエンド
│       └── src/
│           └── mastra/
│               ├── agents/     # AIエージェント
│               ├── workflows/  # ワークフロー
│               ├── tools/      # ツール
│               └── routes/     # APIルート
├── packages/
│   ├── types/                  # 共有型定義
│   ├── storage/                # S3/MinIOストレージクライアント
│   └── typescript-config/      # TypeScript設定
├── docker-compose.yml          # MinIO設定
└── turbo.json                  # Turborepo設定
```

## API エンドポイント

### プロジェクト管理

| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/projects` | 新規プロジェクト作成 |
| GET | `/projects/list` | プロジェクト一覧取得 |
| GET | `/projects/:id` | プロジェクト詳細取得 |
| POST | `/projects/:id/generate` | マンガ生成開始 |
| GET | `/projects/:id/status` | 生成ステータス取得 |
| GET | `/projects/:id/pages` | 生成ページ取得 |

### 素材管理

| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/assets` | 素材一覧取得 |
| GET | `/assets/upload-url` | アップロードURL取得 |
| POST | `/assets/upload` | 素材アップロード |
| POST | `/assets/delete` | 素材削除 |
| GET | `/assets/download-url` | ダウンロードURL取得 |

### ワークフロー

| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/api/workflows/mangaGeneration/start` | マンガ生成ワークフロー実行 |

## 素材管理

### 素材タイプ

| タイプ | 説明 |
|--------|------|
| `character` | キャラクター参照画像 |
| `background` | 背景素材 |
| `effect` | エフェクト（集中線など） |
| `reference` | その他の参照画像 |
| `generated` | AI生成画像 |

### ローカル開発 vs 本番環境

- **ローカル**: Docker上のMinIOを使用（S3互換API）
- **本番**: AWS S3を直接使用

ストレージクライアントは環境変数に基づいて自動的に切り替わります。

## 開発コマンド

```bash
# 開発サーバー起動
pnpm dev

# ビルド
pnpm build

# 型チェック
pnpm type-check

# リント
pnpm lint
```

## Docker コマンド

```bash
# MinIO起動
docker-compose up -d

# MinIO停止
docker-compose down

# ログ確認
docker-compose logs -f minio

# データ削除（完全リセット）
docker-compose down -v
```

## ライセンス

MIT
