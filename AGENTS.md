# AGENTS.md

このドキュメントは、AIエージェントがこのリポジトリで作業する際のガイドラインを定義します。

## Principle

- 回答及びPRの本文やドキュメントは日本語で書いてください。ただし、コードへのコメントは英語で書いてください。
- ドキュメントはMarkdownで書き、作図はmermaid記法で書いてください。
- 変更を加える前に、既存のコードパターンとアーキテクチャを理解してください。

## Project Overview

**hibi** は、Developer向けのCLIベース日報管理ツールです。Gitレポジトリをストレージとして利用し、Markdownで日報を管理します。LLMによる支援機能を持ち、日々のタスク管理から振り返りまでを効率化します。

## Tech Stack

- **Runtime**: Bun
- **Language**: TypeScript
- **CLI Framework**: Commander.js
- **Web UI**: Svelte
- **Test**: Bun test
- **Linter/Formatter**: Biome

## Directory Structure

```
src/
├── index.ts           # エントリーポイント、CLIコマンドの定義
├── commands/          # 各コマンドの実装
│   ├── todo.ts        # タスク登録
│   ├── done.ts        # タスク完了
│   ├── memo.ts        # メモ機能
│   ├── summary.ts     # LLMサマリ生成
│   ├── log.ts         # LLMログ自動生成
│   ├── sync.ts        # Git同期
│   ├── init.ts        # 初期化
│   ├── edit.ts        # エディタ起動
│   ├── view.ts        # 日報表示
│   ├── list.ts        # タスク一覧
│   ├── project.ts     # プロジェクト管理
│   ├── config.ts      # 設定管理
│   ├── remote.ts      # リモート設定
│   └── web.ts         # Webサーバー起動
├── lib/               # 共通ライブラリ
│   ├── daily.ts       # 日報ファイル操作
│   ├── daily-api.ts   # Web API用日報操作
│   ├── config.ts      # 設定ファイル読み書き
│   ├── config-api.ts  # Web API用設定操作
│   ├── git.ts         # Git操作
│   ├── history.ts     # シェル履歴取得
│   ├── completion.ts  # シェル補完
│   ├── utils.ts       # ユーティリティ関数
│   ├── web-server.ts  # Webサーバー実装
│   └── llm/           # LLMクライアント
├── types/             # 型定義
├── web/               # Svelte Webアプリ
└── __tests__/         # テストファイル
```

## Coding Rules

### TypeScript

- 型を厳密に守り、`any`や`unknown`などのキャスティングをなるべく使わずにコーディングしてください。
- 変更点は、可読性を重視しつつ、コードのステップ数は行数もなるべく減らす方向性で、美しいコードを書く必要があります。
- `function`には、必ずJSDocにてParameterとReturn valueに対する説明が必要です。

```typescript
/**
 * Adds a new todo item to the daily file.
 * @param text - The todo item text
 * @param options - Optional settings for the todo
 * @returns The created todo item or null if failed
 */
function addTodo(text: string, options?: TodoOptions): Todo | null {
  // ...
}
```

### Import/Export

- ESモジュール形式を使用してください。
- 相対パスでのインポートを使用してください。

### Error Handling

- ユーザー向けエラーメッセージは日本語で記述してください。
- エラーは適切にハンドリングし、スタックトレースではなくわかりやすいメッセージを表示してください。

## Testing

- 関数を追加した場合は、必ず対応するユニットテストを作成または更新してください。

### テストファイル配置

- テストは `src/__tests__/` ディレクトリに配置
- ファイル名は `*.test.ts` 形式
- ユニットテストと統合テスト（`scenario_*.test.ts`）を分離

### テスト実行

```bash
# 全テスト実行
bun run test

# 特定のテストファイル実行
bun test src/__tests__/daily.test.ts
```

## Setup

```bash
# パッケージインストール
bun install

# 開発実行
bun run dev

# テスト
bun run test

# リント
bun run lint

# フォーマット
bun run format

# ビルド
bun run build
```

## Key Concepts

### Space (プロジェクト)

- 日報は「Space」（以前は「Project」と呼ばれていた）単位で管理されます
- 各Spaceは `projects/<space-name>/` ディレクトリに格納されます
- `default` Spaceが常に存在します

### Daily File

- 日報は `YYYYMMDD.md` 形式のMarkdownファイルで管理されます
- セクション: `## Todo`, `## Memo`, `## Summary by LLM`, `## Log By LLM`

### Configuration

- グローバル設定: `~/.config/hibi/hibi.yaml`
- Space設定: `<spaceRoot>/hibi.yaml`（グローバル設定を上書き）

## Common Patterns

### コマンド実装パターン

```typescript
import { Command } from "commander";
import { requireSpaceRoot } from "../lib/config";

export function registerMyCommand(program: Command) {
  program
    .command("mycommand")
    .description("コマンドの説明")
    .argument("[arg]", "引数の説明")
    .option("-f, --flag", "オプションの説明")
    .action(async (arg, options) => {
      const spaceRoot = await requireSpaceRoot();
      // コマンドロジック
    });
}
```

### 日報操作パターン

```typescript
import { getTodayPath, readDailyFile, writeDailyFile } from "../lib/daily";

const dailyPath = getTodayPath(spaceRoot);
const content = await readDailyFile(dailyPath);
// 操作
await writeDailyFile(dailyPath, modifiedContent);
```

## Documentation

- `docs/SPEC.md`: 詳細な仕様書
- `docs/get-started.md`: ユーザー向けガイド
- `README.md`: プロジェクト概要

## LLM Integration

- `@ai-sdk/anthropic`, `@ai-sdk/google`, `@ai-sdk/openai`, `ollama-ai-provider` をサポート
- LLM設定は `hibi.yaml` で管理
- LLM機能: `summary`（サマリ生成）、`log`（ログ自動生成）
