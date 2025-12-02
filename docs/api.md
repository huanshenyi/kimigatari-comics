# API エンドポイント

## プロジェクト管理

| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/projects` | 新規プロジェクト作成 |
| GET | `/projects/list` | プロジェクト一覧取得 |
| GET | `/projects/:id` | プロジェクト詳細取得 |
| POST | `/projects/:id/generate` | マンガ生成開始 |
| GET | `/projects/:id/status` | 生成ステータス取得 |
| GET | `/projects/:id/pages` | 生成ページ取得 |

## 素材管理

| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/assets` | 素材一覧取得 |
| GET | `/assets/upload-url` | アップロードURL取得 |
| POST | `/assets/upload` | 素材アップロード |
| POST | `/assets/delete` | 素材削除 |
| GET | `/assets/download-url` | ダウンロードURL取得 |

## ワークフロー

| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/api/workflows/mangaGeneration` | マンガ生成ワークフロー実行 |
