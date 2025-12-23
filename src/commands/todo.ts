/**
 * Hibi CLI - todo コマンド
 * タスクを追加
 */

import { Command } from "commander";
import { loadConfig, requireProjectRoot } from "../lib/config";
import { addChildTask, addTask, ensureDailyFile } from "../lib/daily";
import { getTodayString } from "../lib/utils";

/**
 * todoコマンドを作成
 */
export function createTodoCommand(): Command {
    const command = new Command("todo")
        .alias("t")
        .description("タスクを追加")
        .argument("<text...>", "タスクの内容")
        .option("-p, --parent <id>", "親タスクIDを指定して子タスクを追加")
        .action((textParts: string[], options: { parent?: string }) => {
            const text = textParts.join(" ");
            if (options.parent) {
                const parentId = Number.parseInt(options.parent, 10);
                if (Number.isNaN(parentId) || parentId < 1) {
                    console.error("エラー: 親タスクIDは正の整数で指定してください");
                    process.exit(1);
                }
                addChildTodoTask(text, parentId);
            } else {
                addTodoTask(text);
            }
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

    // 日報ファイルを確保
    ensureDailyFile(projectRoot, projectName, dateStr);

    // タスクを追加
    addTask(projectRoot, text, projectName, dateStr);

    console.log(`✓ タスクを追加しました: ${text}`);
}

/**
 * 子タスクを追加
 */
function addChildTodoTask(text: string, parentId: number): void {
    const projectRoot = requireProjectRoot();
    const config = loadConfig();
    const projectName = config.currentProject || "default";
    const dateStr = getTodayString();

    // 日報ファイルを確保
    ensureDailyFile(projectRoot, projectName, dateStr);

    // 子タスクを追加
    const result = addChildTask(projectRoot, text, parentId, projectName, dateStr);

    if (result.success) {
        console.log(`✓ 子タスクを追加しました (親ID: ${parentId}): ${text}`);
    } else {
        console.error(`エラー: ${result.error}`);
        process.exit(1);
    }
}
