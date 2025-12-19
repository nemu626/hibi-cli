/**
 * Hibi CLI - done コマンド
 * タスクを完了にする
 */

import { Command } from "commander";
import { loadConfig, requireProjectRoot } from "../lib/config";
import {
    completeTask,
    completeTaskById,
    ensureDailyFile,
    parseTasks,
    readDailyFile,
} from "../lib/daily";
import { getTodayString } from "../lib/utils";

/**
 * doneコマンドを作成
 */
export function createDoneCommand(): Command {
    const command = new Command("done")
        .alias("d")
        .description("タスクを完了にする")
        .argument("[text...]", "完了するタスクの内容（部分一致）")
        .option("-i, --id <id>", "指定したIDのタスクを完了")
        .option("-l, --last", "最後に登録したタスクを完了")
        .option("--pop", "最後に登録したタスクを完了（--lastのエイリアス）")
        .option("-f, --first", "最初のタスクを完了")
        .option("-a, --all", "すべてのタスクを完了")
        .action(
            (
                textParts: string[],
                options: {
                    id?: string;
                    last?: boolean;
                    pop?: boolean;
                    first?: boolean;
                    all?: boolean;
                },
            ) => {
                const text = textParts.join(" ");
                // --pop は --last のエイリアス
                if (options.pop) {
                    options.last = true;
                }
                completeDoneTask(text, options);
            },
        );

    return command;
}

/**
 * タスクを完了にする
 */
function completeDoneTask(
    text: string,
    options: { id?: string; last?: boolean; first?: boolean; all?: boolean },
): void {
    const projectRoot = requireProjectRoot();
    const config = loadConfig();
    const projectName = config.currentProject || "default";
    const dateStr = getTodayString();

    // 日報ファイルを確保
    ensureDailyFile(projectRoot, projectName, dateStr);

    // 日報を読み込み
    const content = readDailyFile(projectRoot, projectName, dateStr);
    const tasks = parseTasks(content);
    const todoTasks = tasks.filter((t) => t.status === "todo");

    if (todoTasks.length === 0) {
        console.log("未完了のタスクはありません");
        return;
    }

    // --id: IDを指定して完了
    // または引数が数字のみ、または「数字:タスク名」形式の場合もIDとして扱う
    const idMatch = text ? text.match(/^(\d+)(:|$)/) : null;
    if (options.id || idMatch) {
        const taskId = Number.parseInt(options.id || idMatch?.[1] || "", 10);
        if (Number.isNaN(taskId) || taskId < 1) {
            console.error("エラー: 無効なIDです");
            return;
        }
        const result = completeTaskById(projectRoot, taskId, projectName, dateStr);
        if (result.success) {
            console.log(`✓ タスクを完了しました: ${result.taskText}`);
        } else if (result.taskText) {
            console.log(`タスクは既に完了済みです: ${result.taskText}`);
        } else {
            console.error(`エラー: ID ${taskId} のタスクが見つかりません`);
            console.log("\nタスク一覧:");
            for (const task of tasks) {
                const checkbox = task.status === "done" ? "✓" : "○";
                console.log(`  ${task.id}. ${checkbox} ${task.text}`);
            }
        }
        return;
    }

    // --all: すべてのタスクを完了
    if (options.all) {
        let completedCount = 0;
        for (const task of todoTasks) {
            const success = completeTask(projectRoot, task.text, projectName, dateStr);
            if (success) {
                completedCount++;
            }
        }
        console.log(`✓ ${completedCount}件のタスクを完了しました`);
        return;
    }

    // --first: 最初のタスクを完了
    if (options.first) {
        const firstTask = todoTasks[0];
        if (firstTask) {
            const success = completeTask(projectRoot, firstTask.text, projectName, dateStr);
            if (success) {
                console.log(`✓ タスクを完了しました: ${firstTask.text}`);
            } else {
                console.error("エラー: タスクの完了に失敗しました");
            }
        }
        return;
    }

    // --last / --pop: 最後のタスクを完了
    if (options.last) {
        const lastTask = todoTasks[todoTasks.length - 1];
        if (lastTask) {
            const success = completeTask(projectRoot, lastTask.text, projectName, dateStr);
            if (success) {
                console.log(`✓ タスクを完了しました: ${lastTask.text}`);
            } else {
                console.error("エラー: タスクの完了に失敗しました");
            }
        }
        return;
    }

    // テキスト指定: 部分一致で完了
    if (text) {
        const success = completeTask(projectRoot, text, projectName, dateStr);
        if (success) {
            console.log(`✓ タスクを完了しました: ${text}`);
        } else {
            console.error(`エラー: タスクが見つかりません: ${text}`);
            console.log("\n未完了のタスク:");
            for (const task of todoTasks) {
                console.log(`  ${task.id}. ${task.text}`);
            }
        }
        return;
    }

    // 引数がない場合はヘルプを表示
    console.log("使い方:");
    console.log("  hibi done <タスク>   - 指定したタスクを完了（部分一致）");
    console.log("  hibi done --id <id>  - 指定したIDのタスクを完了");
    console.log("  hibi done --last     - 最後に登録したタスクを完了");
    console.log("  hibi done --first    - 最初のタスクを完了");
    console.log("  hibi done --all      - すべてのタスクを完了");
}
