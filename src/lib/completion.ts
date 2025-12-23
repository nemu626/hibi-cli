/**
 * Hibi CLI - Shell Completion
 * zsh/bash/fish用の補完機能
 */

// @ts-expect-error - omelette doesn't have type definitions
import omelette from "omelette";
import { loadConfig } from "./config";
import { parseTasks, readDailyFile } from "./daily";
import { findProjectRoot, getTodayString } from "./utils";

/**
 * 未完了タスクの一覧を取得（ID:タスク名 形式）
 */
function getTodoTasks(): string[] {
    try {
        const projectRoot = findProjectRoot();
        if (!projectRoot) {
            return [];
        }

        const config = loadConfig();
        const projectName = config.currentProject || "default";
        const dateStr = getTodayString();

        // 日報ファイルがなければ空配列
        const content = readDailyFile(projectRoot, projectName, dateStr);
        if (!content) {
            return [];
        }

        const tasks = parseTasks(content);
        const todoTasks = tasks.filter((t) => t.status === "todo");

        // ID:タスク名 形式で返す（スペースはアンダースコアに置換）
        return todoTasks.map((t) => `${t.id}:${t.text.replace(/\s+/g, "_")}`);
    } catch {
        return [];
    }
}

/**
 * 利用可能なコマンド一覧
 */
const COMMANDS = [
    "init",
    "todo",
    "t",
    "done",
    "d",
    "list",
    "l",
    "memo",
    "m",
    "edit",
    "e",
    "sync",
    "project",
    "p",
    "view",
    "v",
];

/**
 * Completion設定を初期化
 */
export function setupCompletion(): void {
    // --completion オプションの処理
    if (process.argv.includes("--completion")) {
        // Completionスクリプトを出力
        const completion = omelette("hibi <command> <task>");
        completion.on("command", ({ reply }: { reply: (values: string[]) => void }) => {
            reply(COMMANDS);
        });
        completion.on(
            "task",
            ({ before, reply }: { before: string; reply: (values: string[]) => void }) => {
                if (before === "done" || before === "d") {
                    reply(getTodoTasks());
                }
            },
        );
        completion.init();
        process.exit(0);
    }

    if (process.argv.includes("--completion-install")) {
        // シェル初期化ファイルに自動インストール
        const completion = omelette("hibi <command> <task>");
        completion.on("command", ({ reply }: { reply: (values: string[]) => void }) => {
            reply(COMMANDS);
        });
        completion.on(
            "task",
            ({ before, reply }: { before: string; reply: (values: string[]) => void }) => {
                if (before === "done" || before === "d") {
                    reply(getTodoTasks());
                }
            },
        );
        completion.setupShellInitFile();
        console.log("✓ Completion設定をインストールしました。シェルを再起動してください。");
        process.exit(0);
    }

    // 通常実行時はcompletionを初期化
    const completion = omelette("hibi <command> <task>");
    completion.on("command", ({ reply }: { reply: (values: string[]) => void }) => {
        reply(COMMANDS);
    });
    completion.on(
        "task",
        ({ before, reply }: { before: string; reply: (values: string[]) => void }) => {
            if (before === "done" || before === "d") {
                reply(getTodoTasks());
            }
        },
    );
    completion.init();
}
