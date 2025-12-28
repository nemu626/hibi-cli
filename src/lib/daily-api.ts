/**
 * Hibi CLI - Daily API Handler
 * REST API for daily log operations
 */

import { readdirSync } from "node:fs";
import { join } from "node:path";
import type { Task } from "../types";
import { loadConfig } from "./config";
import {
    addChildTask,
    addMemo,
    addTask,
    completeTaskById,
    ensureDailyFile,
    getSectionContent,
    parseTasks,
    readDailyFile,
    uncompleteTaskById,
    updateSection,
    updateTaskById,
    writeDailyFile,
} from "./daily";
import { generateLLMText } from "./llm/client";
import { findProjectRoot, getDailyDir, getTodayString } from "./utils";

export interface DailyData {
    date: string;
    tasks: Task[];
    memo: string;
    summaryByLLM: string;
    logByLLM: string;
}

/**
 * GET /api/projects - プロジェクト一覧を取得
 */
export function getProjectsHandler(): Response {
    const projectRoot = findProjectRoot();
    if (!projectRoot) {
        return Response.json({ error: "hibiプロジェクトが見つかりません" }, { status: 404 });
    }

    const projectsDir = join(projectRoot, "projects");
    try {
        const projects = readdirSync(projectsDir, { withFileTypes: true })
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name);

        return Response.json({ projects, projectRoot });
    } catch {
        return Response.json({ projects: [], projectRoot });
    }
}

/**
 * GET /api/projects/:name/dates - プロジェクトの日報日付一覧を取得
 */
export function getProjectDatesHandler(projectName: string): Response {
    const projectRoot = findProjectRoot();
    if (!projectRoot) {
        return Response.json({ error: "hibiプロジェクトが見つかりません" }, { status: 404 });
    }

    const dailyDir = getDailyDir(projectRoot, projectName);
    try {
        const dates = readdirSync(dailyDir)
            .filter((file) => file.endsWith(".md"))
            .map((file) => file.replace(".md", ""))
            .sort()
            .reverse();

        return Response.json({ dates });
    } catch {
        return Response.json({ dates: [] });
    }
}

/**
 * GET /api/daily/:project/:date - 日報データを取得
 */
export function getDailyHandler(projectName: string, dateStr: string): Response {
    const projectRoot = findProjectRoot();
    if (!projectRoot) {
        return Response.json({ error: "hibiプロジェクトが見つかりません" }, { status: 404 });
    }

    ensureDailyFile(projectRoot, projectName, dateStr);
    const content = readDailyFile(projectRoot, projectName, dateStr);

    const tasks = parseTasks(content);
    const memo = getSectionContent(content, "Memo");
    const summaryByLLM = getSectionContent(content, "Summary by LLM");
    const logByLLM = getSectionContent(content, "Log By LLM");

    const data: DailyData = {
        date: dateStr,
        tasks,
        memo,
        summaryByLLM,
        logByLLM,
    };

    return Response.json(data);
}

/**
 * POST /api/daily/:project/:date/task - タスクを追加
 */
export async function addTaskHandler(
    request: Request,
    projectName: string,
    dateStr: string,
): Promise<Response> {
    const projectRoot = findProjectRoot();
    if (!projectRoot) {
        return Response.json({ error: "hibiプロジェクトが見つかりません" }, { status: 404 });
    }

    try {
        const body = (await request.json()) as { text: string };
        if (!body.text || typeof body.text !== "string") {
            return Response.json({ error: "タスクテキストが必要です" }, { status: 400 });
        }

        addTask(projectRoot, body.text, projectName, dateStr);
        return Response.json({ success: true });
    } catch {
        return Response.json({ error: "タスクの追加に失敗しました" }, { status: 500 });
    }
}

/**
 * PUT /api/daily/:project/:date/task/:id - タスクを完了にする
 */
export async function completeTaskHandler(
    projectName: string,
    dateStr: string,
    taskId: number,
): Promise<Response> {
    const projectRoot = findProjectRoot();
    if (!projectRoot) {
        return Response.json({ error: "hibiプロジェクトが見つかりません" }, { status: 404 });
    }

    try {
        const result = completeTaskById(projectRoot, taskId, projectName, dateStr);
        if (result.success) {
            return Response.json({ success: true, taskText: result.taskText });
        }
        return Response.json({ success: false, error: "タスクが見つかりません" }, { status: 404 });
    } catch {
        return Response.json({ error: "タスクの更新に失敗しました" }, { status: 500 });
    }
}

/**
 * POST /api/daily/:project/:date/memo - メモを追加
 */
export async function addMemoHandler(
    request: Request,
    projectName: string,
    dateStr: string,
): Promise<Response> {
    const projectRoot = findProjectRoot();
    if (!projectRoot) {
        return Response.json({ error: "hibiプロジェクトが見つかりません" }, { status: 404 });
    }

    try {
        const body = (await request.json()) as { text: string };
        if (!body.text || typeof body.text !== "string") {
            return Response.json({ error: "メモテキストが必要です" }, { status: 400 });
        }

        addMemo(projectRoot, body.text, projectName, dateStr);
        return Response.json({ success: true });
    } catch {
        return Response.json({ error: "メモの追加に失敗しました" }, { status: 500 });
    }
}

/**
 * PUT /api/daily/:project/:date/memo - メモセクションを更新
 */
export async function updateMemoHandler(
    request: Request,
    projectName: string,
    dateStr: string,
): Promise<Response> {
    const projectRoot = findProjectRoot();
    if (!projectRoot) {
        return Response.json({ error: "hibiプロジェクトが見つかりません" }, { status: 404 });
    }

    try {
        const body = (await request.json()) as { content: string };
        if (body.content === undefined) {
            return Response.json({ error: "メモ内容が必要です" }, { status: 400 });
        }

        // 現在のファイル内容を読み込み、Memoセクションを更新
        ensureDailyFile(projectRoot, projectName, dateStr);
        const content = readDailyFile(projectRoot, projectName, dateStr);
        const lines = content.split("\n");

        let memoStart = -1;
        let memoEnd = -1;

        for (let i = 0; i < lines.length; i++) {
            if (lines[i]?.match(/^##\s+Memo/i)) {
                memoStart = i + 1;
            } else if (memoStart !== -1 && lines[i]?.match(/^##\s+Summary by LLM/i)) {
                // Only match the known next section after Memo
                memoEnd = i;
                break;
            }
        }

        if (memoStart === -1) {
            return Response.json({ error: "Memoセクションが見つかりません" }, { status: 400 });
        }

        if (memoEnd === -1) {
            memoEnd = lines.length;
        }

        // Memoセクションを置き換え
        const newLines = [...lines.slice(0, memoStart), body.content, ...lines.slice(memoEnd)];

        writeDailyFile(projectRoot, newLines.join("\n"), projectName, dateStr);
        return Response.json({ success: true });
    } catch {
        return Response.json({ error: "メモの更新に失敗しました" }, { status: 500 });
    }
}

/**
 * GET /api/today - 今日の日付を取得
 */
export function getTodayHandler(): Response {
    return Response.json({ today: getTodayString() });
}

/**
 * POST /api/daily/:project/:date/task/:id/child - 子タスクを追加
 */
export async function addChildTaskHandler(
    request: Request,
    projectName: string,
    dateStr: string,
    parentId: number,
): Promise<Response> {
    const projectRoot = findProjectRoot();
    if (!projectRoot) {
        return Response.json({ error: "hibiプロジェクトが見つかりません" }, { status: 404 });
    }

    try {
        const body = (await request.json()) as { text: string };
        if (!body.text || typeof body.text !== "string") {
            return Response.json({ error: "タスクテキストが必要です" }, { status: 400 });
        }

        const result = addChildTask(projectRoot, body.text, parentId, projectName, dateStr);
        if (result.success) {
            return Response.json({ success: true });
        }
        return Response.json({ success: false, error: result.error }, { status: 400 });
    } catch {
        return Response.json({ error: "子タスクの追加に失敗しました" }, { status: 500 });
    }
}

/**
 * DELETE /api/daily/:project/:date/task/:id/complete - タスクの完了を取り消す
 */
export async function uncompleteTaskHandler(
    projectName: string,
    dateStr: string,
    taskId: number,
): Promise<Response> {
    const projectRoot = findProjectRoot();
    if (!projectRoot) {
        return Response.json({ error: "hibiプロジェクトが見つかりません" }, { status: 404 });
    }

    try {
        const result = uncompleteTaskById(projectRoot, taskId, projectName, dateStr);
        if (result.success) {
            return Response.json({ success: true, taskText: result.taskText });
        }
        return Response.json({ success: false, error: "タスクが見つかりません" }, { status: 404 });
    } catch {
        return Response.json({ error: "タスクの更新に失敗しました" }, { status: 500 });
    }
}

/**
 * PATCH /api/daily/:project/:date/task/:id - タスクのテキストを更新
 */
export async function updateTaskHandler(
    request: Request,
    projectName: string,
    dateStr: string,
    taskId: number,
): Promise<Response> {
    const projectRoot = findProjectRoot();
    if (!projectRoot) {
        return Response.json({ error: "hibiプロジェクトが見つかりません" }, { status: 404 });
    }

    try {
        const body = (await request.json()) as { text: string };
        if (!body.text || typeof body.text !== "string") {
            return Response.json({ error: "タスクテキストが必要です" }, { status: 400 });
        }

        const result = updateTaskById(projectRoot, taskId, body.text, projectName, dateStr);
        if (result.success) {
            return Response.json({ success: true });
        }
        return Response.json({ success: false, error: "タスクが見つかりません" }, { status: 404 });
    } catch {
        return Response.json({ error: "タスクの更新に失敗しました" }, { status: 500 });
    }
}

/**
 * POST /api/daily/:project/:date/summary - LLMでサマリを生成
 */
export async function generateSummaryHandler(
    projectName: string,
    dateStr: string,
): Promise<Response> {
    const projectRoot = findProjectRoot();
    if (!projectRoot) {
        return Response.json({ error: "hibiプロジェクトが見つかりません" }, { status: 404 });
    }

    try {
        const config = loadConfig();
        if (!config.llm || !config.llm.provider || config.llm.provider === "none") {
            return Response.json({ error: "LLMプロバイダーが設定されていません" }, { status: 400 });
        }

        const content = readDailyFile(projectRoot, projectName, dateStr);
        if (!content) {
            return Response.json({ error: "日報ファイルが見つかりません" }, { status: 404 });
        }

        const todoContent = getSectionContent(content, "Todo");
        const memoContent = getSectionContent(content, "Memo");

        if (!todoContent && !memoContent) {
            return Response.json({ error: "TodoもMemoも詳細がありません" }, { status: 400 });
        }

        const prompt = `あなたは日報の要約を作成するアシスタントです。
以下の日報内容を簡潔に要約してください。

# 日報内容

## Todo
${todoContent}

## Memo
${memoContent}

# 出力形式
- 1-3文程度の要約を日本語で作成
- 重要な成果や進捗を強調
- 課題があれば簡潔に触れる
- 「本日は」などの主語は省略可
`;

        const result = await generateLLMText(prompt, config.llm);
        updateSection(projectRoot, "Summary by LLM", result.text, projectName, dateStr);

        return Response.json({ success: true, summary: result.text });
    } catch (error) {
        console.error("Summary generation error:", error);
        return Response.json({ error: "サマリの生成に失敗しました" }, { status: 500 });
    }
}

/**
 * POST /api/daily/:project/:date/log - LLMでログを生成
 */
export async function generateLogHandler(projectName: string, dateStr: string): Promise<Response> {
    const projectRoot = findProjectRoot();
    if (!projectRoot) {
        return Response.json({ error: "hibiプロジェクトが見つかりません" }, { status: 404 });
    }

    try {
        const config = loadConfig();
        if (!config.llm || !config.llm.provider || config.llm.provider === "none") {
            return Response.json({ error: "LLMプロバイダーが設定されていません" }, { status: 400 });
        }

        const content = readDailyFile(projectRoot, projectName, dateStr);
        if (!content) {
            return Response.json({ error: "日報ファイルが見つかりません" }, { status: 404 });
        }

        const todoContent = getSectionContent(content, "Todo");
        const memoContent = getSectionContent(content, "Memo");

        if (!todoContent && !memoContent) {
            return Response.json({ error: "TodoもMemoも詳細がありません" }, { status: 400 });
        }

        const prompt = `あなたは日報を詳細な作業ログに変換するアシスタントです。
以下の日報内容から、詳細な作業ログを作成してください。

# 日報内容

## Todo
${todoContent}

## Memo
${memoContent}

# 出力形式
- 時系列順に作業内容を記述
- 各作業項目を箇条書きで
- 技術的な詳細や決定事項を含める
- 日本語で作成
`;

        const result = await generateLLMText(prompt, config.llm);
        updateSection(projectRoot, "Log By LLM", result.text, projectName, dateStr);

        return Response.json({ success: true, log: result.text });
    } catch (error) {
        console.error("Log generation error:", error);
        return Response.json({ error: "ログの生成に失敗しました" }, { status: 500 });
    }
}
