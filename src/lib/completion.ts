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
 * 全タスクの一覧を取得（ID:タスク名 形式） - 親タスク候補用
 */
function getAllTasks(): string[] {
    try {
        const projectRoot = findProjectRoot();
        if (!projectRoot) {
            return [];
        }

        const config = loadConfig();
        const projectName = config.currentProject || "default";
        const dateStr = getTodayString();

        const content = readDailyFile(projectRoot, projectName, dateStr);
        if (!content) {
            return [];
        }

        const tasks = parseTasks(content);
        // ID:タスク名 形式で返す（スペースはアンダースコアに置換）
        return tasks.map((t) => `${t.id}:${t.text.replace(/\s+/g, "_")}`);
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
 * タスク補完が必要かどうか判定（コマンドライン全体を解析）
 */
function shouldCompleteWithTasks(line: string): "todo" | "done" | null {
    const parts = line.trim().split(/\s+/);

    // doneコマンドの場合は未完了タスク
    // hibi done <Tab> or hibi d <Tab>
    if (parts.length >= 2 && (parts[1] === "done" || parts[1] === "d")) {
        return "done";
    }

    // --parent / -p の後は全タスク（親タスク候補）
    // hibi todo -p <Tab> or hibi todo --parent <Tab>
    // hibi t -p <Tab> or hibi t --parent <Tab>
    if (parts.length >= 3 && (parts[1] === "todo" || parts[1] === "t")) {
        const lastPart = parts[parts.length - 1];
        const secondLastPart = parts[parts.length - 2];

        // -p または --parent が最後の引数の場合（まだID未入力）
        if (lastPart === "-p" || lastPart === "--parent") {
            return "todo";
        }
        // -p または --parent の次の位置にいる場合（ID入力中）
        if (secondLastPart === "-p" || secondLastPart === "--parent") {
            return "todo";
        }
    }

    return null;
}

/**
 * Completion設定を初期化
 */
export function setupCompletion(): void {
    // --completion オプションの処理
    if (process.argv.includes("--completion")) {
        // 4スロットで定義して、より多くの位置で補完を発火させる
        const completion = omelette("hibi <command> <arg1> <arg2> <arg3>");
        completion.on("command", ({ reply }: { reply: (values: string[]) => void }) => {
            reply(COMMANDS);
        });
        // すべての引数スロットで同じロジックを適用
        const handleArg = ({
            line,
            reply,
        }: {
            line: string;
            reply: (values: string[]) => void;
        }) => {
            const type = shouldCompleteWithTasks(line);
            if (type === "done") {
                reply(getTodoTasks());
            } else if (type === "todo") {
                reply(getAllTasks());
            }
        };
        completion.on("arg1", handleArg);
        completion.on("arg2", handleArg);
        completion.on("arg3", handleArg);
        completion.init();
        process.exit(0);
    }

    if (process.argv.includes("--completion-install")) {
        // シェル初期化ファイルに自動インストール
        const completion = omelette("hibi <command> <arg1> <arg2> <arg3>");
        completion.on("command", ({ reply }: { reply: (values: string[]) => void }) => {
            reply(COMMANDS);
        });
        const handleArg = ({
            line,
            reply,
        }: {
            line: string;
            reply: (values: string[]) => void;
        }) => {
            const type = shouldCompleteWithTasks(line);
            if (type === "done") {
                reply(getTodoTasks());
            } else if (type === "todo") {
                reply(getAllTasks());
            }
        };
        completion.on("arg1", handleArg);
        completion.on("arg2", handleArg);
        completion.on("arg3", handleArg);
        completion.setupShellInitFile();
        console.log("✓ Completion設定をインストールしました。シェルを再起動してください。");
        process.exit(0);
    }

    // 通常実行時はcompletionを初期化
    const completion = omelette("hibi <command> <arg1> <arg2> <arg3>");
    completion.on("command", ({ reply }: { reply: (values: string[]) => void }) => {
        reply(COMMANDS);
    });
    const handleArg = ({ line, reply }: { line: string; reply: (values: string[]) => void }) => {
        const type = shouldCompleteWithTasks(line);
        if (type === "done") {
            reply(getTodoTasks());
        } else if (type === "todo") {
            reply(getAllTasks());
        }
    };
    completion.on("arg1", handleArg);
    completion.on("arg2", handleArg);
    completion.on("arg3", handleArg);
    completion.init();
}
