/**
 * Hibi CLI - list コマンド
 * 今日のタスク一覧を表示
 */

import { Command } from "commander";
import { loadConfig, requireProjectRoot } from "../lib/config";
import { ensureDailyFile, parseTasks, readDailyFile } from "../lib/daily";
import { formatDateString, getTodayString } from "../lib/utils";
import type { Task } from "../types";

/**
 * listコマンドを作成
 */
export function createListCommand(): Command {
    const command = new Command("list")
        .alias("l")
        .description("今日のタスク一覧を表示")
        .option("-a, --all", "完了済みタスクも表示")
        .option("-d, --date <date>", "指定した日付のタスクを表示 (YYYYMMDD)")
        .action((options: { all?: boolean; date?: string }) => {
            listTasks(options);
        });

    return command;
}

/**
 * タスク一覧を表示
 */
function listTasks(options: { all?: boolean; date?: string }): void {
    const projectRoot = requireProjectRoot();
    const config = loadConfig();
    const projectName = config.currentProject || "default";
    const dateStr = options.date || getTodayString();

    // 日報ファイルを確保
    ensureDailyFile(projectRoot, projectName, dateStr);

    // 日報を読み込み
    const content = readDailyFile(projectRoot, projectName, dateStr);
    const tasks = parseTasks(content);

    // 表示用に日付をフォーマット
    const formattedDate = formatDateString(dateStr);
    console.log(`\n📅 ${formattedDate} のタスク\n`);

    if (tasks.length === 0) {
        console.log("  タスクはありません\n");
        console.log("  'hibi todo <タスク>' でタスクを追加しましょう！");
        return;
    }

    // タスクを分類
    const todoTasks: Task[] = [];
    const doneTasks: Task[] = [];

    for (const task of tasks) {
        if (task.status === "todo") {
            todoTasks.push(task);
        } else if (task.status === "done") {
            doneTasks.push(task);
        }
    }

    // 未完了タスクを表示
    if (todoTasks.length > 0) {
        console.log("📋 Todo:");
        printTasks(todoTasks);
        console.log("");
    }

    // 完了タスクを表示（-a オプション時のみ、またはtodoがない場合）
    if (options.all || todoTasks.length === 0) {
        if (doneTasks.length > 0) {
            console.log("✅ Done:");
            printTasks(doneTasks);
            console.log("");
        }
    } else if (doneTasks.length > 0) {
        console.log(`  (完了: ${doneTasks.length}件 - 全て表示するには -a オプション)`);
        console.log("");
    }

    // サマリを表示
    console.log(`📊 合計: ${todoTasks.length}件未完了 / ${doneTasks.length}件完了`);
}

/**
 * タスクを表示
 */
function printTasks(tasks: Task[]): void {
    for (const task of tasks) {
        const indent = "  ".repeat(task.indent + 1);
        const checkbox = task.status === "done" ? "✓" : "○";
        const style = task.status === "done" ? "\x1b[90m" : ""; // 完了は灰色
        const reset = task.status === "done" ? "\x1b[0m" : "";
        // IDをシアン色で表示
        const idStr = task.id ? `\x1b[36m${task.id}.\x1b[0m ` : "";
        console.log(`${indent}${idStr}${style}${checkbox} ${task.text}${reset}`);
    }
}
