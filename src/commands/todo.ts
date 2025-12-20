/**
 * Hibi CLI - todo コマンド
 * タスクを追加
 */

import { Command } from "commander";
import { loadConfig, requireProjectRoot } from "../lib/config";
import { addTask, ensureDailyFile } from "../lib/daily";
import { getTodayString } from "../lib/utils";

/**
 * todoコマンドを作成
 */
export function createTodoCommand(): Command {
    const command = new Command("todo")
        .alias("t")
        .description("タスクを追加")
        .argument("<text...>", "タスクの内容")
        .option("-p, --parent <id>", "親タスクのIDを指定")
        .action((textParts: string[], options: { parent?: string }) => {
            const text = textParts.join(" ");
            const parentId = options.parent ? parseInt(options.parent, 10) : undefined;
            addTodoTask(text, parentId);
        });

    return command;
}

/**
 * タスクを追加
 */
function addTodoTask(text: string, parentId?: number): void {
    const projectRoot = requireProjectRoot();
    const config = loadConfig();
    const projectName = config.currentProject || "default";
    const dateStr = getTodayString();

    // 日報ファイルを確保
    ensureDailyFile(projectRoot, projectName, dateStr);

    // タスクを追加
    addTask(projectRoot, text, projectName, dateStr, parentId);

    if (parentId) {
        console.log(`✓ タスクをID:${parentId}の子タスクとして追加しました: ${text}`);
    } else {
        console.log(`✓ タスクを追加しました: ${text}`);
    }
}
