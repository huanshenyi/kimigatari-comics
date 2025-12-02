# 開発コマンド

## 基本コマンド

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

## Supabase コマンド

```bash
# ローカルSupabase起動
supabase start

# ローカルSupabase停止
supabase stop

# ステータス確認（接続情報の再表示）
supabase status
```

## Drizzle コマンド

```bash
cd packages/db

# スキーマをDBに直接反映（開発用）
pnpm db:push

# マイグレーションSQL生成
pnpm db:generate

# マイグレーション実行
pnpm db:migrate

# Drizzle Studio（DBブラウザ）
pnpm db:studio
```

> **マイグレーション管理**:
> - 開発時は `db:push` でスキーマを直接反映
> - 本番リリース時は `db:generate` → `db:migrate` で履歴管理

## Docker コマンド（MinIO）

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
