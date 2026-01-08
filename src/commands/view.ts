/**
 * Hibi CLI - view コマンド
 * 日報ファイルのMarkdownを表示
 */

import { Command } from "commander";
import { loadConfig, requireProjectRoot } from "../lib/config";
import { ensureDailyFile, readDailyFile } from "../lib/daily";
import { getTodayString } from "../lib/utils";

// markedの初期化状態を保持
let markedInitialized = false;

/**
 * Markdownをシンタックスハイライトして出力
 * TTY（ターミナル直接）の場合は色付け、パイプの場合はプレーンテキスト
 */
async function printMarkdown(content: string): Promise<void> {
    if (process.stdout.isTTY) {
        const { marked } = await import("marked");

        if (!markedInitialized) {
            const { markedTerminal } = await import("marked-terminal");
            // biome-ignore lint/suspicious/noExplicitAny: marked-terminal types incompatible with latest marked
            marked.use(markedTerminal() as any);
            markedInitialized = true;
        }

        // marked.parseはPromise<string>を返すが、同期的に動作する設定なのでawaitなしで使用
        const rendered = marked.parse(content) as string | Promise<string>;
        const output = rendered instanceof Promise ? await rendered : rendered;

        // 末尾の余分な改行を削除
        process.stdout.write(`${output.trimEnd()}\n`);
    } else {
        console.log(content);
    }
}

/**
 * viewコマンドを作成
 */
export function createViewCommand(): Command {
    const command = new Command("view")
        .alias("v")
        .description("日報のMarkdownを表示")
        .option("-d, --date <date>", "指定した日付の日報を表示 (YYYYMMDD)")
        .option("-t, --todo", "Todoセクションのみを表示")
        .option("-m, --memo", "Memoセクションのみを表示")
        .action(async (options: { date?: string; todo?: boolean; memo?: boolean }) => {
            await viewDaily(options);
        });

    return command;
}

/**
 * 日報を表示
 */
async function viewDaily(options: { date?: string; todo?: boolean; memo?: boolean }): Promise<void> {
    const projectRoot = requireProjectRoot();
    const config = loadConfig();
    const projectName = config.currentProject || "default";
    const dateStr = options.date || getTodayString();

    // 日報ファイルを確保
    ensureDailyFile(projectRoot, projectName, dateStr);

    // 日報を読み込み
    const content = readDailyFile(projectRoot, projectName, dateStr);

    if (!content) {
        console.log("日報ファイルが空です");
        return;
    }

    if (options.todo) {
        // Todoセクションのみを表示
        const todoSection = extractSection(content, "Todo");
        if (todoSection) {
            await printMarkdown(todoSection);
        } else {
            console.log("Todoセクションが見つかりません");
        }
    } else if (options.memo) {
        // Memoセクションのみを表示
        const memoSection = extractSection(content, "Memo");
        if (memoSection) {
            await printMarkdown(memoSection);
        } else {
            console.log("Memoセクションが見つかりません");
        }
    } else {
        // 全体を表示
        await printMarkdown(content);
    }
}

/**
 * Markdownからセクションを抽出
 * セクションヘッダー（## SectionName）とその内容を返す
 */
function extractSection(content: string, sectionName: string): string | null {
    const lines = content.split("\n");
    const sectionRegex = new RegExp(`^##\\s+${sectionName}`, "i");

    let startIndex = -1;
    let endIndex = lines.length;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i]?.match(sectionRegex)) {
            startIndex = i;
        } else if (startIndex !== -1 && lines[i]?.match(/^##\s+/)) {
            endIndex = i;
            break;
        }
    }

    if (startIndex === -1) {
        return null;
    }

    // セクションヘッダーを含めて抽出
    const sectionLines = lines.slice(startIndex, endIndex);

    // 末尾の空行を削除
    while (sectionLines.length > 0 && sectionLines[sectionLines.length - 1]?.trim() === "") {
        sectionLines.pop();
    }

    return sectionLines.join("\n");
}
