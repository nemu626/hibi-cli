/**
 * Hibi CLI - todo コマンド
 * タスクを追加
 */

import { Command } from "commander";
import { loadConfig, requireProjectRoot } from "../lib/config";
import { addTask, addTaskWithParent, ensureDailyFile } from "../lib/daily";
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
            addTodoTask(text, options.parent);
        });

    return command;
}

/**
 * タスクを追加
 */
function addTodoTask(text: string, parentIdStr?: string): void {
    const projectRoot = requireProjectRoot();
    const config = loadConfig();
    const projectName = config.currentProject || "default";
    const dateStr = getTodayString();

    // 日報ファイルを確保
    ensureDailyFile(projectRoot, projectName, dateStr);

    if (parentIdStr) {
        const parentId = parseInt(parentIdStr, 10);
        if (isNaN(parentId)) {
            console.error("エラー: 親タスクIDは数値を指定してください");
            process.exit(1);
        }
        addTaskWithParent(projectRoot, parentId, text, projectName, dateStr);
        console.log(`✓ 子タスクを追加しました (Parent: ${parentId}): ${text}`);
    } else {
        // タスクを追加
        addTask(projectRoot, text, projectName, dateStr);
        console.log(`✓ タスクを追加しました: ${text}`);
    }
}
