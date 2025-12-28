#!/usr/bin/env bun
/**
 * Hibi CLI - 日報管理ツール
 *
 * Developer向けのCLIベース日報管理ツール
 * Gitレポジトリをストレージとして利用し、Markdownで日報を管理
 */

import { Command } from "commander";
import { createDoneCommand } from "./commands/done";
import { createEditCommand } from "./commands/edit";
// コマンドのインポート
import { createInitCommand } from "./commands/init";
import { createListCommand } from "./commands/list";
import { createLogCommand } from "./commands/log";
import { createMemoCommand } from "./commands/memo";
import { createProjectCommand } from "./commands/project";
import { createRemoteCommand } from "./commands/remote";
import { createSummaryCommand } from "./commands/summary";
import { createSyncCommand } from "./commands/sync";
import { createTodoCommand } from "./commands/todo";
import { createViewCommand } from "./commands/view";
import { setupCompletion } from "./lib/completion";

// Shell Completionのセットアップ（--completion, --completion-install の処理）
setupCompletion();

// メインプログラム
const program = new Command();

program
    .name("hibi")
    .description("Developer向けCLI日報管理ツール")
    .version("0.1.0")
    .option("--completion", "Shell completion スクリプトを出力")
    .option("--completion-install", "Shell completion を自動インストール");

// コマンドを登録
program.addCommand(createInitCommand());
program.addCommand(createListCommand());
program.addCommand(createTodoCommand());
program.addCommand(createDoneCommand());
program.addCommand(createMemoCommand());
program.addCommand(createEditCommand());
program.addCommand(createSyncCommand());
program.addCommand(createProjectCommand());
program.addCommand(createRemoteCommand());
program.addCommand(createViewCommand());
program.addCommand(createSummaryCommand());
program.addCommand(createLogCommand());

// パースして実行
program.parse(process.argv);
