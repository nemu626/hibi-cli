#!/usr/bin/env bun
/**
 * Hibi CLI - 日報管理ツール
 *
 * Developer向けのCLIベース日報管理ツール
 * Gitレポジトリをストレージとして利用し、Markdownで日報を管理
 */

import { Command } from "commander";

// コマンドのインポート
import { createInitCommand } from "./commands/init";
import { createListCommand } from "./commands/list";
import { createTodoCommand } from "./commands/todo";
import { createDoneCommand } from "./commands/done";
import { createMemoCommand } from "./commands/memo";
import { createEditCommand } from "./commands/edit";
import { createSyncCommand } from "./commands/sync";
import { createProjectCommand } from "./commands/project";

// メインプログラム
const program = new Command();

program
    .name("hibi")
    .description("Developer向けCLI日報管理ツール")
    .version("0.1.0");

// コマンドを登録
program.addCommand(createInitCommand());
program.addCommand(createListCommand());
program.addCommand(createTodoCommand());
program.addCommand(createDoneCommand());
program.addCommand(createMemoCommand());
program.addCommand(createEditCommand());
program.addCommand(createSyncCommand());
program.addCommand(createProjectCommand());

// パースして実行
program.parse(process.argv);
