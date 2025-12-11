# Hibi(日々): CLI tool for Daily Report 

hibiは、日々の業務内容を簡潔に記録するためのCLI日報ツールです。


## Features

- gitレポジトリ × Markdownによる日報管理
- プロジェクト単位でフォルダを切り替えられる
- リモートリポジトリへのSync機能
- CLIからTodoタスクを管理
  - 登録したタスクのオートコンプリート
- メモ機能
  - インラインもしくは、ファイル指定からのメモが可能
- LLM連動サマライズ機能
  - 日報のサマリをLLMにより自動生成する。
- タスク自動記録機能
  - zshのhistoryや、gitのコミット履歴をLLMにより、タスクに自動記録する。
- Webアプリ機能
  - `hibi web`でwebインターフェースが起動し、WEB上でもエディティングが可能

## Usage
```bash
$ hibi todo 水やりをする

$ hibi todo
> [ ] 水やりをする

$ hibi done 水やりをする
> Task '水やりをする' is done.
```


## Commands

#### `todo`: Todoタスクを登録する
`todo <task>` : Todoタスクを登録します。
`todo [-p|--parent] <parentTask> <childTask>` : 親タスクを指定して子タスクを登録します。

#### `done`: Todoタスクの完了
- arguments
  - `task`: Todoタスクの内容

## Requirements
- git
- tech 