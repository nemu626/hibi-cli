/**
 * Hibi CLI - todo コマンド
 * タスクを追加
 */

import { Command } from "commander";
import { loadConfig, requireProjectRoot } from "../lib/config";
import { addSubTask, addTask, ensureDailyFile } from "../lib/daily";
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
            addTodoTask(text, options.parent ? parseInt(options.parent, 10) : undefined);
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

    if (parentId !== undefined) {
        // サブタスクを追加
        if (Number.isNaN(parentId)) {
            console.error("エラー: 親IDは数値を指定してください");
            process.exit(1);
        }

        const success = addSubTask(projectRoot, parentId, text, projectName, dateStr);
        if (success) {
            console.log(`✓ 親タスク ${parentId} にサブタスクを追加しました: ${text}`);
        } else {
            console.error(`エラー: 親タスク ID:${parentId} が見つかりません`);
            process.exit(1);
        }
    } else {
        // 通常タスクを追加
        addTask(projectRoot, text, projectName, dateStr);
        console.log(`✓ タスクを追加しました: ${text}`);
    }
}
