# 素材管理

## 素材タイプ

| タイプ | 説明 |
|--------|------|
| `character` | キャラクター参照画像 |
| `background` | 背景素材 |
| `effect` | エフェクト（集中線など） |
| `reference` | その他の参照画像 |
| `generated` | AI生成画像 |

## ローカル開発 vs 本番環境

- **ローカル**: Docker上のMinIOを使用（S3互換API）
- **本番**: AWS S3を直接使用

ストレージクライアントは環境変数に基づいて自動的に切り替わります。

## MinIO コンソール

ローカル開発時: http://localhost:9001
- ユーザー名: `minioadmin`
- パスワード: `minioadmin`
