/**
 * Hibi CLI - 日報ファイル管理
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { Task } from "../types";
import { formatDateString, getDailyFilePath, getTodayString } from "./utils";

/**
 * 日報ファイルのテンプレートを生成
 * SPEC準拠: Todo, Memo, Summary by LLM, Log By LLM セクションを含む
 */
export function generateDailyTemplate(dateStr: string): string {
    const formattedDate = formatDateString(dateStr);
    return `# ${formattedDate}

## Todo

## Memo

## Summary by LLM

## Log By LLM

`;
}

/**
 * 日報ファイルが存在するか確認
 */
export function dailyFileExists(
    projectRoot: string,
    projectName: string = "default",
    dateStr: string = getTodayString(),
): boolean {
    const filePath = getDailyFilePath(projectRoot, projectName, dateStr);
    return existsSync(filePath);
}

/**
 * 日報ファイルを作成（存在しない場合のみ）
 */
export function ensureDailyFile(
    projectRoot: string,
    projectName: string = "default",
    dateStr: string = getTodayString(),
): string {
    const filePath = getDailyFilePath(projectRoot, projectName, dateStr);

    if (!existsSync(filePath)) {
        const dir = dirname(filePath);
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
        const template = generateDailyTemplate(dateStr);
        writeFileSync(filePath, template, "utf-8");
    }

    return filePath;
}

/**
 * 日報ファイルの内容を読み込む
 */
export function readDailyFile(
    projectRoot: string,
    projectName: string = "default",
    dateStr: string = getTodayString(),
): string {
    const filePath = getDailyFilePath(projectRoot, projectName, dateStr);

    if (!existsSync(filePath)) {
        return "";
    }

    return readFileSync(filePath, "utf-8");
}

/**
 * 日報ファイルに内容を書き込む
 */
export function writeDailyFile(
    projectRoot: string,
    content: string,
    projectName: string = "default",
    dateStr: string = getTodayString(),
): void {
    const filePath = ensureDailyFile(projectRoot, projectName, dateStr);
    writeFileSync(filePath, content, "utf-8");
}

/**
 * Markdownからタスク一覧をパース
 */
export function parseTasks(content: string): Task[] {
    const lines = content.split("\n");
    const tasks: Task[] = [];
    let inTodoSection = false;

    for (const line of lines) {
        // ## Todo セクションの開始を検出
        if (line.match(/^##\s+Todo/i)) {
            inTodoSection = true;
            continue;
        }

        // 次のセクション（## で始まる行）で終了
        if (inTodoSection && line.match(/^##\s+/)) {
            break;
        }

        // タスク行をパース
        if (inTodoSection) {
            const taskMatch = line.match(/^(\s*)- \[([ x])\]\s*(.+)$/);
            if (taskMatch) {
                const indent = Math.floor((taskMatch[1]?.length || 0) / 2);
                const status = taskMatch[2] === "x" ? "done" : "todo";
                const text = taskMatch[3] || "";

                tasks.push({ id: tasks.length + 1, text, status, indent });
            }
        }
    }

    return tasks;
}

/**
 * タスクをMarkdown形式に変換
 */
export function formatTask(task: Task): string {
    const indentStr = "  ".repeat(task.indent);
    const checkbox = task.status === "done" ? "[x]" : "[ ]";
    return `${indentStr}- ${checkbox} ${task.text}`;
}

/**
 * タスク一覧をMarkdown形式に変換
 */
export function formatTasks(tasks: Task[]): string {
    return tasks.map(formatTask).join("\n");
}

/**
 * 日報ファイルにタスクを追加
 */
export function addTask(
    projectRoot: string,
    taskText: string,
    projectName: string = "default",
    dateStr: string = getTodayString(),
): void {
    ensureDailyFile(projectRoot, projectName, dateStr);
    const content = readDailyFile(projectRoot, projectName, dateStr);
    const lines = content.split("\n");

    // ## Todo セクションを探して、その直後にタスクを追加
    let todoSectionIndex = -1;
    let insertIndex = -1;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i]?.match(/^##\s+Todo/i)) {
            todoSectionIndex = i;
            insertIndex = i + 1;

            // 既存のタスクの最後を探す
            for (let j = i + 1; j < lines.length; j++) {
                const line = lines[j];
                if (line?.match(/^##\s+/)) {
                    // 次のセクションに到達
                    insertIndex = j;
                    break;
                }
                if (line?.match(/^\s*- \[[ x]\]/)) {
                    // タスク行の後に挿入
                    insertIndex = j + 1;
                }
            }
            break;
        }
    }

    if (todoSectionIndex === -1) {
        console.error("エラー: Todoセクションが見つかりません");
        return;
    }

    const newTask: Task = { text: taskText, status: "todo", indent: 0 };
    lines.splice(insertIndex, 0, formatTask(newTask));

    writeDailyFile(projectRoot, lines.join("\n"), projectName, dateStr);
}

/**
 * サブタスクを追加
 */
export function addSubTask(
    projectRoot: string,
    parentId: number,
    taskText: string,
    projectName: string = "default",
    dateStr: string = getTodayString(),
): boolean {
    ensureDailyFile(projectRoot, projectName, dateStr);
    const content = readDailyFile(projectRoot, projectName, dateStr);
    const lines = content.split("\n");

    let inTodoSection = false;
    let currentTaskId = 0;
    let found = false;
    let insertIndex = -1;
    let parentIndent = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // ## Todo セクションの開始を検出
        if (line.match(/^##\s+Todo/i)) {
            inTodoSection = true;
            continue;
        }

        // 次のセクション（## で始まる行）で終了
        if (inTodoSection && line.match(/^##\s+/)) {
            break;
        }

        if (inTodoSection) {
            const taskMatch = line.match(/^(\s*)- \[([ x])\]\s*(.+)$/);
            if (taskMatch) {
                currentTaskId++;
                if (currentTaskId === parentId) {
                    found = true;
                    parentIndent = Math.floor((taskMatch[1]?.length || 0) / 2);
                    insertIndex = i + 1;

                    // サブタスク（インデントが深い）をスキップ
                    for (let j = i + 1; j < lines.length; j++) {
                        const nextLine = lines[j];
                        if (!nextLine) continue;

                        const nextMatch = nextLine.match(/^(\s*)- \[([ x])\]/);
                        if (nextMatch) {
                            const nextIndent = Math.floor((nextMatch[1]?.length || 0) / 2);
                            if (nextIndent > parentIndent) {
                                insertIndex = j + 1;
                            } else {
                                break;
                            }
                        } else {
                            break;
                        }
                    }
                    break;
                }
            }
        }
    }

    if (!found) {
        return false;
    }

    const newTask: Task = { text: taskText, status: "todo", indent: parentIndent + 1 };
    lines.splice(insertIndex, 0, formatTask(newTask));

    writeDailyFile(projectRoot, lines.join("\n"), projectName, dateStr);
    return true;
}

/**
 * タスクを完了にする
 */
export function completeTask(
    projectRoot: string,
    taskText: string,
    projectName: string = "default",
    dateStr: string = getTodayString(),
): boolean {
    const content = readDailyFile(projectRoot, projectName, dateStr);
    const lines = content.split("\n");
    let found = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        // 未完了タスクでテキストがマッチするものを探す
        const match = line.match(/^(\s*)- \[ \]\s*(.+)$/);
        if (match?.[2]?.includes(taskText)) {
            const indent = match[1] || "";
            lines[i] = `${indent}- [x] ${match[2]}`;
            found = true;
            break;
        }
    }

    if (found) {
        writeDailyFile(projectRoot, lines.join("\n"), projectName, dateStr);
    }

    return found;
}

/**
 * IDを指定してタスクを完了にする
 */
export function completeTaskById(
    projectRoot: string,
    taskId: number,
    projectName: string = "default",
    dateStr: string = getTodayString(),
): { success: boolean; taskText?: string } {
    const content = readDailyFile(projectRoot, projectName, dateStr);
    const lines = content.split("\n");
    let inTodoSection = false;
    let currentTaskId = 0;
    let found = false;
    let taskText: string | undefined;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        // ## Todo セクションの開始を検出
        if (line.match(/^##\s+Todo/i)) {
            inTodoSection = true;
            continue;
        }

        // 次のセクション（## で始まる行）で終了
        if (inTodoSection && line.match(/^##\s+/)) {
            break;
        }

        // タスク行をカウント
        if (inTodoSection) {
            const taskMatch = line.match(/^(\s*)- \[([ x])\]\s*(.+)$/);
            if (taskMatch) {
                currentTaskId++;
                if (currentTaskId === taskId) {
                    // 未完了タスクの場合のみ完了にする
                    if (taskMatch[2] === " ") {
                        const indent = taskMatch[1] || "";
                        taskText = taskMatch[3] || "";
                        lines[i] = `${indent}- [x] ${taskText}`;
                        found = true;
                    } else {
                        // 既に完了済み
                        taskText = taskMatch[3] || "";
                    }
                    break;
                }
            }
        }
    }

    if (found) {
        writeDailyFile(projectRoot, lines.join("\n"), projectName, dateStr);
    }

    return { success: found, taskText };
}

/**
 * 日報にメモを追加
 */
export function addMemo(
    projectRoot: string,
    memoText: string,
    projectName: string = "default",
    dateStr: string = getTodayString(),
): void {
    ensureDailyFile(projectRoot, projectName, dateStr);
    const content = readDailyFile(projectRoot, projectName, dateStr);
    const lines = content.split("\n");

    // ## Memo セクションを探して、その直後にメモを追加
    let memoSectionIndex = -1;
    let insertIndex = -1;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i]?.match(/^##\s+Memo/i)) {
            memoSectionIndex = i;
            insertIndex = i + 1;

            // 次のセクション、または空行を探す
            for (let j = i + 1; j < lines.length; j++) {
                const line = lines[j];
                if (line?.match(/^##\s+/)) {
                    // 次のセクションの直前に挿入
                    insertIndex = j;
                    break;
                }
                insertIndex = j + 1;
            }
            break;
        }
    }

    if (memoSectionIndex === -1) {
        console.error("エラー: Memoセクションが見つかりません");
        return;
    }

    // メモを追加（リスト形式）
    lines.splice(insertIndex, 0, `- ${memoText}`);

    writeDailyFile(projectRoot, lines.join("\n"), projectName, dateStr);
}
