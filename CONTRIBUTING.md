# コントリビューションガイド

キミガタリコミックスへの貢献に興味を持っていただきありがとうございます。

## 開発環境のセットアップ

### 前提条件

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose

### セットアップ手順

1. リポジトリをフォーク
2. ローカルにクローン

```bash
git clone https://github.com/YOUR_USERNAME/kimigatari-comics.git
cd kimigatari-comics
```

3. 依存関係をインストール

```bash
pnpm install
```

4. 環境変数を設定

```bash
cp apps/api/.env.example apps/api/.env.local
cp apps/web/.env.example apps/web/.env.local
```

5. MinIOを起動

```bash
docker-compose up -d
```

6. 開発サーバーを起動

```bash
pnpm dev
```

## コーディング規約

### 基本ルール

- TypeScript strict mode を使用
- ESLint + Prettier でフォーマット
- コンポーネントは関数コンポーネント + Hooks

### コミットメッセージ

[Conventional Commits](https://www.conventionalcommits.org/) に従ってください。

```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント更新
style: フォーマット変更（コードの動作に影響しない）
refactor: リファクタリング
test: テスト追加・修正
chore: ビルド・設定変更
```

例:
```
feat: マンガエディタに吹き出し回転機能を追加
fix: 画像アップロード時のメモリリークを修正
docs: READMEにトラブルシューティングを追加
```

## Pull Request の作成

1. 新しいブランチを作成

```bash
git checkout -b feature/your-feature-name
```

2. 変更をコミット

```bash
git add .
git commit -m "feat: your feature description"
```

3. フォークにプッシュ

```bash
git push origin feature/your-feature-name
```

4. GitHub で Pull Request を作成

### PR チェックリスト

- [ ] `pnpm lint` が通ること
- [ ] `pnpm type-check` が通ること
- [ ] `pnpm build` が成功すること
- [ ] 必要に応じてドキュメントを更新

## Issue の報告

### バグ報告

- 再現手順を明確に記載
- 期待される動作と実際の動作を記載
- 環境情報（OS、ブラウザ、Node.js バージョン）を記載

### 機能要望

- 解決したい課題を明確に記載
- 可能であれば具体的な実装案を提案

## 質問・ディスカッション

不明点があれば、Issue を作成するか、Discussions で質問してください。

## ライセンス

貢献いただいたコードは [MIT License](./LICENSE) のもとで公開されます。
