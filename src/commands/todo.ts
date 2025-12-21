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
        .option("-p, --parent <id>", "親タスクIDを指定")
        .action((textParts: string[], options: { parent?: string }) => {
            const text = textParts.join(" ");
            addTodoTask(text, options.parent);
        });

    return command;
}

/**
 * タスクを追加
 */
function addTodoTask(text: string, parentId?: string): void {
    const projectRoot = requireProjectRoot();
    const config = loadConfig();
    const projectName = config.currentProject || "default";
    const dateStr = getTodayString();

    // 日報ファイルを確保
    ensureDailyFile(projectRoot, projectName, dateStr);

    // タスクを追加
    const result = addTask(
        projectRoot,
        text,
        projectName,
        dateStr,
        parentId ? Number(parentId) : undefined,
    );

    if (result.success) {
        console.log(`✓ タスクを追加しました: ${text}`);
    } else {
        console.error(`エラー: タスクの追加に失敗しました: ${result.error}`);
    }
}
