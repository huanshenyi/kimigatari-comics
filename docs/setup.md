# セットアップガイド

## 前提条件

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose（ローカルストレージ・データベース用）
- Supabase CLI（ローカルDB用）

## 1. リポジトリのクローン

```bash
git clone <repository-url>
cd kimigatari-comics
```

## 2. 依存関係のインストール

```bash
pnpm install
```

## 3. 環境変数の設定

### apps/web/.env.local

```env
NEXT_PUBLIC_API_URL=http://localhost:4111

# Supabase（ローカル開発: supabase start 後に表示される値を使用）
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### packages/db/.env.lcoal

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
```

### apps/api/.env.local

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

## 4. ローカルデータベース（Supabase）の起動

```bash
# Supabase CLIをインストール（初回のみ）
brew install supabase/tap/supabase
# または: npm install -g supabase

# ローカルSupabaseを起動（Docker必要）
supabase start
```

起動後に表示される接続情報の例：

```
         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
  S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

これらの値を`apps/web/.env.local`に設定してください。

## 5. マイグレーションの実行

Drizzle ORMでスキーマ管理を行っています：

```bash
cd packages/db

# スキーマをDBに直接反映（開発用）
pnpm db:push

# マイグレーションSQL生成（本番用）
pnpm db:generate

# マイグレーション実行
pnpm db:migrate

# Drizzle Studio（DBブラウザ）
pnpm db:studio
```

Supabase Studio: http://127.0.0.1:54323

## 6. ローカルストレージ（MinIO）の起動

```bash
docker compose up -d
```

MinIOコンソール: http://localhost:9001

- ユーザー名: `minioadmin`
- パスワード: `minioadmin`

## 7. 開発サーバーの起動

```bash
# 全アプリを起動
pnpm dev

# 個別に起動
pnpm dev:web    # フロントエンド (http://localhost:3000)
pnpm dev:api    # バックエンド (http://localhost:4111)
```
