# マンガ生成アプリ 実装計画 TodoList

## プロジェクト概要

- **プロジェクト名**: kimigatari-comics
- **技術スタック**: TypeScript, Next.js, Mastra, Turborepo, pnpm, Supabase, AWS (S3, Bedrock)
- **目的**: プロットと素材からAIで白黒マンガを生成し、ユーザーが編集可能なアプリケーション

---

## Phase 0: プロジェクト初期設定

### 環境構築

- [x] pnpm のインストール確認
- [x] Turborepo モノレポの初期化
- [x] ディレクトリ構造の作成
  - [x] `apps/web` - Next.js フロントエンド
  - [x] `apps/api` - Hono + Mastra バックエンド
  - [ ] `apps/iac` - CDK AWSのインフラ
  - [x] `packages/types` - 共有型定義
  - [ ] `packages/ui` - 共有UIコンポーネント
  - [ ] `packages/db` - Supabase クライアント
  - [x] `packages/canvas` - Canvas操作ユーティリティ
  - [x] `packages/config` - 共有設定(ESLint, TypeScript, Tailwind)

### 設定ファイル

- [x] `pnpm-workspace.yaml` 作成
- [x] `turbo.json` 作成
- [x] ルート `package.json` 作成
- [x] TypeScript 共有設定 (`packages/config/typescript/`)
- [x] ESLint 共有設定 (`packages/config/eslint/`)
- [x] Tailwind 共有設定 (`packages/config/tailwind/`)

### 外部サービス設定

- [ ] Supabase プロジェクト作成
- [ ] AWS アカウント設定確認
- [ ] S3 バケット作成
- [ ] Bedrock モデルアクセス有効化 (Claude, Nova Canvas)
- [x] 環境変数の設定 (`.env.local`, `.env.example`)

---

## Phase 1: 基盤構築 (2週間)

### apps/web (Next.js)

- [x] Next.js 16 (App Router) 初期化
- [x] shadcn/ui セットアップ (Button, Card, Textarea, Input, Progress等)
- [x] Tailwind CSS 設定
- [x] 基本レイアウト作成
  - [x] ヘッダー/ナビゲーション
  - [ ] サイドバー
  - [x] メインコンテンツエリア

### apps/api (Hono + Mastra)

- [x] Hono サーバー初期化 (Mastra内蔵)
- [x] Mastra 初期設定
- [x] Bedrock プロバイダー設定 (Google Gemini使用)
- [x] 基本的なヘルスチェックエンドポイント (Mastra Studio)

### packages/db (Supabase)

- [ ] Supabase クライアント設定
- [ ] データベーススキーマ定義
  - [ ] `projects` テーブル
  - [ ] `characters` テーブル
  - [ ] `pages` テーブル
  - [ ] `panels` テーブル
  - [ ] `speech_bubbles` テーブル
- [ ] 型生成スクリプト設定

### packages/types

- [x] 基本型定義
  - [x] `Project`
  - [x] `Character`
  - [x] `Page`
  - [x] `Panel`
  - [x] `SpeechBubble`
  - [x] `PanelLayout`
  - [x] API リクエスト/レスポンス型

### 認証システム

- [ ] Supabase Auth 設定
- [ ] ログイン/登録ページ作成
- [ ] 認証ミドルウェア実装
- [ ] プロテクトルート設定

### 素材管理

- [ ] S3 アップロード機能
- [ ] 画像アップロードコンポーネント
- [ ] キャラクター登録フォーム
- [ ] 素材一覧表示

---

## Phase 2: AI機能実装

### Mastra Agents

- [x] **StoryAnalyzerAgent** - プロット解析
  - [x] シーン分割ロジック
  - [x] キャラクター抽出
  - [x] セリフ/ナレーション分離
  - [x] 感情/表情指示生成

- [x] **PanelLayoutAgent** - コマ割り生成
  - [x] ページレイアウト計算
  - [x] コマサイズ最適化
  - [x] 読み順考慮 (右→左)

- [x] **ImageGeneratorAgent** - 画像生成
  - [ ] Nova Canvas 連携 (プレースホルダー実装済み)
  - [x] 白黒マンガスタイル設定
  - [x] キャラクター一貫性維持
  - [ ] 背景生成

- [x] **TextPlacementAgent** - テキスト配置
  - [x] 吹き出し位置計算
  - [x] 縦書きテキスト対応
  - [x] 吹き出しタイプ選択

### Mastra Tools

- [x] `sceneParserTool` - シーン解析ツール
- [ ] `characterExtractorTool` - キャラクター抽出ツール
- [x] `imageGenerationTool` - 画像生成ツール
- [x] `layoutCalculatorTool` - レイアウト計算ツール

### Mastra Workflows

- [x] `manga-generation` ワークフロー
  - [x] Step 1: プロット解析
  - [x] Step 2: コマ割り生成
  - [x] Step 3: 画像生成 (並列)
  - [x] Step 4: テキスト配置
- [x] エラーハンドリング
- [x] 進捗通知機能

### API エンドポイント

- [x] `POST /projects` - プロジェクト作成
- [x] `POST /projects/:id/generate` - マンガ生成開始
- [x] `GET /projects/:id/status` - 生成状況取得
- [x] `GET /projects/:id/pages` - ページ一覧取得
- [ ] `PATCH /panels/:id` - コマ更新
- [ ] `PATCH /speech-bubbles/:id` - 吹き出し更新

---

## Phase 3: エディタ開発

### packages/canvas

- [x] Fabric.js セットアップ
- [x] 基本Canvas操作ユーティリティ
- [x] パネル(コマ)クラス実装
- [x] 吹き出しクラス実装
- [x] 縦書きテキストレンダリング

### マンガエディタコンポーネント

- [x] `MangaCanvas` - メインキャンバス
  - [x] 初期化/破棄処理
  - [x] ズーム/パン機能
  - [x] 選択/マルチ選択

- [x] `PanelEditor` - コマ編集
  - [x] コマ追加
  - [x] コマ削除
  - [x] コマリサイズ
  - [x] コマ移動

- [x] `SpeechBubbleEditor` - 吹き出し編集
  - [x] 吹き出し追加
  - [x] 吹き出しタイプ変更
  - [x] テキスト編集
  - [x] 位置/サイズ調整
  - [ ] しっぽの方向変更

- [x] `Toolbar` - ツールバー
  - [x] 選択ツール
  - [x] コマ追加ツール
  - [x] 吹き出し追加ツール
  - [x] テキストツール
  - [x] 削除ツール

- [x] `LayerPanel` - レイヤーパネル
  - [x] レイヤー一覧表示
  - [x] 表示/非表示切替
  - [x] 順序変更
  - [x] レイヤーロック機能

- [x] `PropertyPanel` - プロパティパネル
  - [x] 選択オブジェクトの属性編集
  - [ ] スタイル設定

### ページ管理

- [x] ページ一覧表示
- [x] ページ追加/削除
- [ ] ページ順序変更
- [ ] サムネイル表示

---

## Phase 4: 高度な編集機能

### Undo/Redo

- [x] 履歴管理システム実装
- [x] Undo 機能
- [x] Redo 機能
- [x] キーボードショートカット (Ctrl+Z, Ctrl+Y)

### 画像操作

- [ ] 画像差し替え機能
- [ ] 画像トリミング
- [ ] 画像回転
- [x] 明度/コントラスト調整 (フィルター実装済み)

### エフェクト

- [ ] 集中線追加
- [ ] 効果線追加
- [ ] スクリーントーン適用
- [ ] ぼかし効果

### テキスト拡張

- [ ] フォント選択
- [ ] フォントサイズ変更
- [ ] 文字間隔調整
- [ ] オノマトペ(擬音語)スタイル

### コラボレーション (オプション)

- [ ] リアルタイム同期検討
- [ ] コメント機能検討

---

## Phase 5: エクスポート・仕上げ

### エクスポート機能

- [x] PNG エクスポート (ページ単位)
- [ ] PDF エクスポート (全ページ)
- [ ] 高解像度出力オプション
- [ ] 印刷用設定 (トンボ、裁ち落とし)

### プレビュー

- [ ] ページめくりプレビュー
- [ ] 見開き表示
- [ ] フルスクリーンモード

### パフォーマンス最適化

- [ ] 画像遅延読み込み
- [ ] Canvas レンダリング最適化
- [ ] API レスポンスキャッシュ
- [ ] 大きなプロジェクトの分割読み込み

### テスト

- [ ] ユニットテスト (Vitest)
- [ ] E2Eテスト (Playwright)
- [ ] AI生成品質テスト

### ドキュメント

- [ ] README.md 作成
- [ ] API ドキュメント
- [ ] ユーザーガイド

### デプロイ

- [ ] CI/CD パイプライン (GitHub Actions)
- [ ] ステージング環境構築
- [ ] 本番環境デプロイ
- [ ] モニタリング設定

---

## 技術的な検証項目 (PoC)

- [ ] Nova Canvas での白黒マンガ生成品質検証
- [ ] キャラクター一貫性維持の手法検討
- [x] Fabric.js での縦書きテキスト実装検証
- [ ] 大量コマ生成時のパフォーマンス測定

---

## 参考リンク

- [Mastra Documentation](https://mastra.ai/docs)
- [Amazon Bedrock](https://docs.aws.amazon.com/bedrock/)
- [Supabase](https://supabase.com/docs)
- [Fabric.js](http://fabricjs.com/docs/)
- [Turborepo](https://turbo.build/repo/docs)
- [Next.js](https://nextjs.org/docs)
- [Hono](https://hono.dev/docs/)

---

## メモ・決定事項

MCPサーバー自由に使って

---

*最終更新: 2025-11-28*
