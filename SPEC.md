# hibi Specification

## 概要 (Overview)
`hibi` は、Developer向けのCLIベース日報管理ツールです。
Gitレポジトリをストレージとして利用し、Markdownで日報を管理します。LLMによる支援機能を持ち、日々のタスク管理から振り返りまでを効率化します。

## アーキテクチャ (Architecture)

### データ構造 (Data Structure)
日報データは、ユーザー指定のGitレポジトリ（ローカル）に保存されます。

```text
root/
├── hibi.yaml          # 設定ファイル
└── projects/          # プロジェクトディレクトリ
    ├── default/       # デフォルトプロジェクト（常に存在）
    │   ├── daily/     # 日報用Markdown
    │   │   ├── 20251211.md
    │   │   └── 20251212.md
    │   └── assets/    # 画像や添付ファイル
    └── other_proj/
        ├── daily/
        └── assets/
```

### 日報ファイル構造 (Daily File Structure)
日報データのマークダウンは、以下のようなテンプレートで管理される
````markdown
# {yyyy-mm-dd}

## Todo
  - [ ] 水やり
  - [ ] 料理
    - [ ] おにぎり
    - [ ] 目玉焼き

## Memo
<!-- Memo1 -->
- 卵が切れてる

<!-- Memo2 -->
- 今日わからなかったコード
```python
    def hibi(self):
        print("hibi")
```

````

### 設定ファイル (Config)
`hibi.yaml` でツール全体の挙動を制御します。

```yaml
remote: 'origin' # リモートレポジトリ名
sync: "manual" # manual | auto | daily
llm:
  provider: "openai" # openai | ollama | gemini | none
  model: "gpt-4o"
  apiKey: "sk-..." # 環境変数でのOverrideも可能にする
  endpoint: "..." # Ollama等の場合
editor: "vi" # デフォルトはシステムのエディタ
```

## 機能仕様 (Feature Specifications)

### 1. コア機能 (Core)

- **初期化 (`init`)**:
  - リモートレポジトリのClone、もしくは新規ディレクトリの作成。
  - `hibi.yaml` の生成。
- **同期 (`sync`)**:
  - 設定に基づき、Git pull/pushを行う。
  - モード:
    - `manual`: コマンド実行時のみ。
    - `auto`: コマンド実行のたびにバックグラウンドでSync (要検討)。
    - `daily`: 日付変更時のファイル作成時などにSync。

### 2. プロジェクト管理 (Project)

- **プロジェクト切り替え (`project switch`)**:
  - 作業対象（コンテキスト）を切り替える。
  - デフォルトで `default` プロジェクトが存在。
- **作成・リネーム (`project create`, `project rename`)**:
  - プロジェクトフォルダの作成とリネーム。

### 3. タスク・日報管理 (Task & Daily)

- **日次処理 (Rollover)**:
  - その日最初のコマンド実行時、当日分ファイルがなければ作成。
  - 前日の「未完了タスク」を当日分に転記（Carry over）。
- **タスク一覧 (`l`, `list`)**:
  - `hibi list`: 今日のTodo、Doneおよび未完了タスクを表示。
- **タスク登録 (`t`, `todo`)**:
  - `hibi todo <text>`: タスク追加。
  - Markdownのチェックボックス形式 ` - [ ] text` で記録。
- **タスク完了 (`d`, `done`)**:
  - `hibi done <text>`: タスクを完了にする。
  - `hibi done [-l|--last|--pop]`: 最後に登録したタスクを完了にする。
  - `hibi done [-a|--all]`: すべてのタスクを完了にする。
  - `hibi done [-f|--first]`: タスクの最上段を完了にする。
  - done task completion
    - `omelette`をつかい、zshにcompletionを実行させる。
    - `.zshrc`に hibi --completion-zshのようなものを登録。
- **メモ (`memo`, `m`)**:
  - `hibi m <text>`: 1行メモに追加。
  - `hibi m [-a|--assets] <path>`: ファイルをそのままassetsに追加する。
  - `hibi m [-f|--file] <path> [-l|--line] <lineRange>`: テキストファイルの特定行を読み込んでメモに追加。（バイナリ系ファイルは許可しない)
    - ソースコードの場合、拡張子から言語を推測して、markdownのシンタックスハイライトを適用する。
- **直接編集 (`edit`)**:
  - `hibi edit`: 現在の日報ファイルを直接編集する。(指定されたeditorを起動する)
- **Sync (`sync`)**:
  - `hibi sync`: Gitのpull/pushを行う。
    - Conflictが発生した場合は、手動で解決する。
  - `hibi sync --push`: Gitのpushのみを行う。
  - `hibi sync --pull`: Gitのpullのみを行う。

### 4. LLM支援 (LLM Features)

- **ログ自動生成 (`log`)**:
  - Zsh history、Git logを取得。
  - LLMにコンテキストとして渡し、「やったこと」リストを生成して日報に追記。
- **サマリ生成 (`summary`)**:
  - 今日の日報内容を要約。

### 5. Web UI (`web`)

- ローカルサーバーを起動し、ブラウザで閲覧・編集。
- 前提: シンプルで高速、AestheticなUI。
- **サイドバー**: プロジェクト一覧、日付一覧（カレンダー等）。
- **エディタ**: コンテンツの表示。チェックボックスなどはインタラクティブに操作可能（クリックでMarkdown更新）。

## 技術スタック (Tech Stack)

- **Runtime**: Bun
- **Language**: TypeScript
- **CLI Framework**: Commander.js
- **Web UI**: Svelte
- **Test**: Bun test

