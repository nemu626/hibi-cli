# Hibi CLIスタートガイド

このドキュメントでは、hibi（日々）CLIツールの使用方法を詳しく解説します。

## 目次

- [インストール](#インストール)
- [クイックスタート](#クイックスタート)
- [コマンドリファレンス](#コマンドリファレンス)
  - [init - プロジェクトの初期化](#init---プロジェクトの初期化)
  - [todo - タスクの追加](#todo---タスクの追加)
  - [done - タスクの完了](#done---タスクの完了)
  - [list - タスク一覧の表示](#list---タスク一覧の表示)
  - [memo - メモの追加](#memo---メモの追加)
  - [edit - 日報の直接編集](#edit---日報の直接編集)
  - [sync - Git同期](#sync---git同期)
  - [project - プロジェクト管理](#project---プロジェクト管理)
- [設定ファイル](#設定ファイル)

---

## インストール

### 前提条件

- [Bun](https://bun.sh/) がインストールされていること
- Git がインストールされていること

### ビルド

```bash
# リポジトリをクローン
git clone https://github.com/your-org/hibi-cli.git
cd hibi-cli

# 依存関係をインストール
bun install

# ビルド（単一実行ファイルを生成）
bun build ./src/index.ts --compile --outfile hibi
```

### PATHへの追加

```bash
# 例: /usr/local/bin にコピー
sudo cp hibi /usr/local/bin/

# または、シンボリックリンクを作成
sudo ln -s $(pwd)/hibi /usr/local/bin/hibi
```

### Shell Completion（オプション）

zsh/bash/fishでのタブ補完を有効にするには、以下を設定してください：

**zshの場合**（`.zshrc`に追加）：
```bash
# hibi completion
source <(hibi --completion)
```

**または自動インストール**：
```bash
hibi --completion-install
```

これにより、`hibi done <Tab>`で未完了タスクの一覧が補完候補として表示されるようになります。

---

## クイックスタート

### 1. 新しいhibiプロジェクトを作成

```bash
mkdir my-diary
cd my-diary
hibi init
```

### 2. タスクを追加して管理

```bash
# タスクを追加
hibi todo 水やりをする

# タスク一覧を表示
hibi list

# タスクを完了
hibi done 水やり
```

### 3. メモを残す

```bash
hibi memo 今日のミーティングで新機能について議論した
```

### 出力例

```
📅 2024-12-11 のタスク

📋 Todo:
  ○ 水やりをする

📊 合計: 1件未完了 / 0件完了
```

---

## コマンドリファレンス

### init - プロジェクトの初期化

新しいhibiプロジェクトを作成します。

#### 構文

```bash
hibi init [directory] [options]
```

#### 引数

| 引数 | 説明 |
|------|------|
| `directory` | プロジェクトディレクトリ（デフォルト: カレントディレクトリ `.`） |

#### オプション

| オプション | 説明 |
|-----------|------|
| `--clone <url>` | 既存のGitリポジトリをクローンして初期化 |
| `--no-git` | Gitリポジトリを初期化しない |

#### 使用例

```bash
# カレントディレクトリで初期化
hibi init

# 新しいディレクトリを作成して初期化
hibi init my-project

# 既存のリポジトリをクローン
hibi init my-project --clone git@github.com:user/diary.git

# Git初期化なしで作成
hibi init my-project --no-git
```

#### 生成されるディレクトリ構造

```
my-project/
├── hibi.yaml          # 設定ファイル
├── .gitignore
└── projects/
    └── default/       # デフォルトプロジェクト
        ├── daily/     # 日報ファイル格納ディレクトリ
        └── assets/    # 添付ファイル格納ディレクトリ
```

---

### todo - タスクの追加

タスクを追加します。

#### 構文

```bash
hibi todo <text>
hibi t <text>       # エイリアス
```

#### 引数

| 引数 | 説明 |
|------|------|
| `text` | タスクの内容（複数の単語可） |

#### 使用例

```bash
# シンプルなタスク追加
hibi todo 水やりをする

# 複数単語のタスク
hibi todo メールの返信 田中さんへ

# 短縮形
hibi t 書類の整理
```

#### 動作

- 当日の日報ファイルが存在しない場合、自動的に作成されます
- タスクはMarkdownのチェックボックス形式 `- [ ] タスク` で記録されます

---

### done - タスクの完了

タスクを完了状態にします。

#### 構文

```bash
hibi done [text] [options]
hibi d [text] [options]    # エイリアス
```

#### 引数

| 引数 | 説明 |
|------|------|
| `text` | 完了するタスクの内容（部分一致で検索） |

#### オプション

| オプション | 説明 |
|-----------|------|
| `-i, --id <id>` | 指定したIDのタスクを完了 |
| `-l, --last` | 最後に登録したタスクを完了 |
| `--pop` | `--last` のエイリアス |
| `-f, --first` | 最初のタスクを完了 |
| `-a, --all` | すべてのタスクを完了 |

#### 使用例

```bash
# テキストで指定（部分一致）
hibi done 水やり

# 最後のタスクを完了
hibi done --last
hibi done --pop    # 同じ

# 最初のタスクを完了
hibi done --first

# すべてのタスクを完了
hibi done --all

# 短縮形
hibi d 水やり
```

#### 動作

- 部分一致で該当するタスクを検索します
- 該当するタスクが見つからない場合、未完了タスクの一覧が表示されます

---

### list - タスク一覧の表示

今日のタスク一覧を表示します。

#### 構文

```bash
hibi list [options]
hibi l [options]     # エイリアス
```

#### オプション

| オプション | 説明 |
|-----------|------|
| `-a, --all` | 完了済みタスクも含めて表示 |
| `-d, --date <date>` | 指定した日付のタスクを表示（形式: YYYYMMDD） |

#### 使用例

```bash
# 今日のタスクを表示
hibi list

# 完了済みも含めて表示
hibi list --all

# 特定の日付を表示
hibi list --date 20241210

# 短縮形
hibi l
hibi l -a
```

#### 出力例

```
📅 2024-12-11 のタスク

📋 Todo:
  ○ 水やりをする
  ○ メールの返信

✅ Done:
  ✓ 書類の整理

📊 合計: 2件未完了 / 1件完了
```

---

### memo - メモの追加

日報にメモを追加します。

#### 構文

```bash
hibi memo <text>
hibi m <text>       # エイリアス
```

#### オプション

| オプション | 説明 |
|-----------|------|
| `-a, --assets <path>` | ファイルをassetsディレクトリにコピー |
| `-f, --file <path>` | テキストファイルの内容をメモに追加 |
| `-l, --line <range>` | 行範囲を指定（例: `1-10`, `5`） |

#### 使用例

```bash
# シンプルなメモ
hibi memo 今日のミーティングで新機能について議論した

# ファイルをassetsに追加
hibi memo --assets ./screenshot.png

# ソースコードをメモに追加
hibi memo --file ./src/index.ts

# 特定の行のみ追加
hibi memo --file ./src/index.ts --line 1-20

# 短縮形
hibi m 重要なメモ
```

#### 動作

- テキストメモは日報の `## Memo` セクションに追加されます
- `--file` オプションでソースコードを追加する場合、拡張子から言語を自動判定してシンタックスハイライトが適用されます
- `--assets` で追加されたファイルは `projects/<project>/assets/` に保存されます

#### 対応言語（拡張子）

TypeScript (`.ts`), JavaScript (`.js`), Python (`.py`), Go (`.go`), Rust (`.rs`), Ruby (`.rb`), Java (`.java`), C/C++ (`.c`, `.cpp`), Shell (`.sh`, `.bash`, `.zsh`), YAML (`.yaml`), JSON (`.json`), Markdown (`.md`), SQL (`.sql`) など

---

### edit - 日報の直接編集

日報ファイルをエディタで直接編集します。

#### 構文

```bash
hibi edit [options]
hibi e [options]     # エイリアス
```

#### オプション

| オプション | 説明 |
|-----------|------|
| `-d, --date <date>` | 指定した日付の日報を編集（形式: YYYYMMDD） |

#### 使用例

```bash
# 今日の日報を編集
hibi edit

# 特定の日付を編集
hibi edit --date 20241210

# 短縮形
hibi e
```

#### 動作

- 環境変数 `EDITOR` または設定ファイルの `editor` で指定されたエディタが起動します
- デフォルトは `vi` です

---

### sync - Git同期

Gitリポジトリと同期します。

#### 構文

```bash
hibi sync [options]
```

#### オプション

| オプション | 説明 |
|-----------|------|
| `--push` | pushのみ実行 |
| `--pull` | pullのみ実行 |

#### 使用例

```bash
# pull と push を両方実行（デフォルト）
hibi sync

# pushのみ
hibi sync --push

# pullのみ
hibi sync --pull
```

#### 動作

1. **pull**: リモートから最新の変更を取得
2. **commit**: ローカルの変更を自動コミット（メッセージ: `hibi: YYYY-MM-DD 更新`）
3. **push**: リモートへプッシュ

#### コンフリクト時の対応

コンフリクトが発生した場合は、手動での解決が必要です：

```bash
cd /path/to/project
git status
# コンフリクトを解決
git add .
git commit
```

---

### project - プロジェクト管理

複数のプロジェクトを管理します。

#### 構文

```bash
hibi project <subcommand>
hibi p <subcommand>    # エイリアス
```

#### サブコマンド

##### list / ls - プロジェクト一覧

```bash
hibi project list
hibi p ls              # 短縮形
```

出力例：
```
📁 プロジェクト一覧:

→ default      # 現在のプロジェクト
  work
  personal
```

##### switch / sw - プロジェクト切り替え

```bash
hibi project switch <name>
hibi p sw <name>       # 短縮形
```

使用例：
```bash
hibi project switch work
```

##### create / new - 新規プロジェクト作成

```bash
hibi project create <name>
hibi p new <name>      # 短縮形
```

使用例：
```bash
hibi project create work
```

> **Note**: プロジェクト名には英数字、ハイフン(`-`)、アンダースコア(`_`)のみ使用可能です。

##### rename - プロジェクト名変更

```bash
hibi project rename <oldName> <newName>
```

使用例：
```bash
hibi project rename old-project new-project
```

> **Note**: `default` プロジェクトの名前は変更できません。

##### current - 現在のプロジェクトを表示

```bash
hibi project current
```

出力例：
```
現在のプロジェクト: work
```

---

## 設定ファイル

### 設定の優先順位

| 優先度 | パス | 用途 |
|--------|------|------|
| 低 | `~/.config/hibi/hibi.yaml` | ユーザーごとのグローバル設定 |
| 高 | `<projectRoot>/hibi.yaml` | プロジェクト固有の設定 |

### 設定例

#### グローバル設定 (`~/.config/hibi/hibi.yaml`)

```yaml
llm:
  provider: "openai"     # openai | ollama | gemini | none
  model: "gpt-4o"
  apiKey: "sk-..."       # 環境変数 HIBI_LLM_API_KEY でも設定可能
  endpoint: "..."        # Ollama等の場合
editor: "code"           # デフォルトはシステムの $EDITOR
defaultProject: "default" # 起動時のデフォルトプロジェクト
```

#### プロジェクト設定 (`<projectRoot>/hibi.yaml`)

```yaml
remote: 'origin'         # リモートレポジトリ名
sync: "manual"           # manual | auto | daily
llm:
  provider: "ollama"     # このプロジェクトではOllamaを使用
  model: "llama3"
```

### 設定項目一覧

| 項目 | 型 | 説明 | デフォルト |
|-----|-----|------|----------|
| `editor` | string | 使用するエディタ | `$EDITOR` または `vi` |
| `defaultProject` | string | デフォルトプロジェクト名 | `default` |
| `remote` | string | Gitリモート名 | `origin` |
| `sync` | string | 同期モード | `manual` |
| `llm.provider` | string | LLMプロバイダー | `none` |
| `llm.model` | string | 使用するモデル | - |
| `llm.apiKey` | string | APIキー | - |
| `llm.endpoint` | string | APIエンドポイント | - |

---

## 日報ファイルの形式

hibiは以下のMarkdown形式で日報を管理します：

```markdown
# 2024-12-11

## Todo
  - [x] 完了したタスク
  - [ ] 未完了のタスク
    - [ ] サブタスク

## Memo
<!-- メモ1 -->
- 今日の気づき

<!-- コードサンプル -->
```typescript
const hello = "world";
```

## Summary by LLM
（LLM機能使用時に自動生成）

## Log By LLM
（LLM機能使用時に自動生成）
```

---

## トラブルシューティング

### 「hibiプロジェクトが見つかりません」エラー

hibiプロジェクトのルートディレクトリ（`hibi.yaml` が存在するディレクトリ）で実行してください。

```bash
cd /path/to/hibi-project
hibi list
```

### エディタが起動しない

環境変数 `EDITOR` を設定するか、`~/.config/hibi/hibi.yaml` で `editor` を指定してください。

```bash
export EDITOR=nano
```

または：

```yaml
# ~/.config/hibi/hibi.yaml
editor: "code"  # VS Codeの場合
```

### Git syncでコンフリクトが発生

手動でコンフリクトを解決してください：

```bash
cd /path/to/project
git status
# コンフリクトファイルを編集
git add .
git commit -m "Resolve conflicts"
hibi sync --push
```

---

## 関連ドキュメント

- [SPEC.md](./SPEC.md) - 詳細な仕様書
