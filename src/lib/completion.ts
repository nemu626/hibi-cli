/**
 * Hibi CLI - Shell Completion
 * zsh/bash/fish用の補完機能
 */

// @ts-ignore - omelette doesn't have type definitions
import omelette from "omelette";
import { loadConfig } from "./config";
import { parseTasks, readDailyFile } from "./daily";
import { findProjectRoot, getTodayString } from "./utils";

/**
 * 未完了タスクの一覧を取得
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

        // IDとテキストを組み合わせて返す
        return todoTasks.map((t) => `${t.id}:${t.text}`);
    } catch {
        return [];
    }
}

/**
 * Completion設定を初期化
 */
export function setupCompletion(): void {
    // hibi <command> <arg> の形式でcompletionを設定
    const completion = omelette("hibi <command> <arg>");

    // done, d コマンドの補完
    completion.on("arg", ({ before, reply }: { before: string; reply: (values: string[]) => void }) => {
        // beforeには前のワード（コマンド）が入る
        if (before === "done" || before === "d") {
            const tasks = getTodoTasks();
            reply(tasks);
        }
    });

    // completionを初期化
    completion.init();

    // --completion-fish / --completion-bash / --completion オプションの処理
    if (process.argv.includes("--completion")) {
        // zsh用のcompletionスクリプトを出力
        console.log(completion.tree);
        process.exit(0);
    }

    if (process.argv.includes("--completion-install")) {
        // シェル初期化ファイルに自動インストール
        completion.setupShellInitFile();
        console.log("✓ Completion設定をインストールしました。シェルを再起動してください。");
        process.exit(0);
    }
}

/**
 * Completionスクリプトを取得
 */
export function getCompletionScript(): string {
    const completion = omelette("hibi <command> <arg>");
    return completion.tree?.toString() || "";
}
