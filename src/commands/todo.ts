/**
 * Hibi CLI - todo コマンド
 * タスクを追加
 */

import { Command } from "commander";
import { loadConfig, requireProjectRoot } from "../lib/config";
import { addTask } from "../lib/daily";
import { getTodayString } from "../lib/utils";

/**
 * todoコマンドを作成
 */
export function createTodoCommand(): Command {
    const command = new Command("todo")
        .alias("t")
        .description("タスクを追加")
        .argument("<text...>", "タスクの内容")
        .action((textParts: string[]) => {
            const text = textParts.join(" ");
            addTodoTask(text);
        });

    return command;
}

/**
 * タスクを追加
 */
function addTodoTask(text: string): void {
    const projectRoot = requireProjectRoot();
    const config = loadConfig();
    const projectName = config.currentProject || "default";
    const dateStr = getTodayString();

    // タスクを追加
    addTask(projectRoot, text, projectName, dateStr);

    console.log(`✓ タスクを追加しました: ${text}`);
}
