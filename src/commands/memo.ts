/**
 * Hibi CLI - memo コマンド
 * メモを追加
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { Command } from "commander";
import { loadConfig, requireProjectRoot } from "../lib/config";
import { addMemo, ensureDailyFile, readDailyFile, writeDailyFile } from "../lib/daily";
import { getAssetsDir, getTodayString } from "../lib/utils";

// 拡張子から言語を推測するマップ
const EXTENSION_TO_LANGUAGE: Record<string, string> = {
    ".ts": "typescript",
    ".tsx": "tsx",
    ".js": "javascript",
    ".jsx": "jsx",
    ".py": "python",
    ".rb": "ruby",
    ".go": "go",
    ".rs": "rust",
    ".java": "java",
    ".c": "c",
    ".cpp": "cpp",
    ".h": "c",
    ".hpp": "cpp",
    ".cs": "csharp",
    ".php": "php",
    ".swift": "swift",
    ".kt": "kotlin",
    ".scala": "scala",
    ".sh": "bash",
    ".bash": "bash",
    ".zsh": "zsh",
    ".fish": "fish",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".json": "json",
    ".xml": "xml",
    ".html": "html",
    ".css": "css",
    ".scss": "scss",
    ".sass": "sass",
    ".less": "less",
    ".md": "markdown",
    ".sql": "sql",
    ".graphql": "graphql",
    ".dockerfile": "dockerfile",
    ".toml": "toml",
};

/**
 * memoコマンドを作成
 */
export function createMemoCommand(): Command {
    const command = new Command("memo")
        .alias("m")
        .description("メモを追加")
        .argument("[text...]", "メモの内容")
        .option("-a, --assets <path>", "ファイルをassetsに追加")
        .option("-f, --file <path>", "テキストファイルの内容をメモに追加")
        .option("-l, --line <range>", "行範囲を指定 (例: 1-10, 5)")
        .action(
            (textParts: string[], options: { assets?: string; file?: string; line?: string }) => {
                handleMemo(textParts, options);
            },
        );

    return command;
}

/**
 * メモを処理
 */
function handleMemo(
    textParts: string[],
    options: { assets?: string; file?: string; line?: string },
): void {
    const projectRoot = requireProjectRoot();
    const config = loadConfig();
    const projectName = config.currentProject || "default";
    const dateStr = getTodayString();

    // 日報ファイルを確保
    ensureDailyFile(projectRoot, projectName, dateStr);

    // --assets: ファイルをassetsにコピー
    if (options.assets) {
        addAssetFile(projectRoot, projectName, options.assets);
        return;
    }

    // --file: ファイル内容をメモに追加
    if (options.file) {
        addFileContent(projectRoot, projectName, dateStr, options.file, options.line);
        return;
    }

    // 通常のメモ
    const text = textParts.join(" ");
    if (!text) {
        console.log("使い方:");
        console.log("  hibi memo <テキスト>           - メモを追加");
        console.log("  hibi memo --assets <path>      - ファイルをassetsに追加");
        console.log("  hibi memo --file <path>        - ファイル内容をメモに追加");
        console.log("  hibi memo --file <path> -l 1-10 - 特定行をメモに追加");
        return;
    }

    addMemo(projectRoot, text, projectName, dateStr);
    console.log(`✓ メモを追加しました: ${text}`);
}

/**
 * ファイルをassetsにコピー
 */
function addAssetFile(projectRoot: string, projectName: string, filePath: string): void {
    if (!existsSync(filePath)) {
        console.error(`エラー: ファイルが見つかりません: ${filePath}`);
        process.exit(1);
    }

    const assetsDir = getAssetsDir(projectRoot, projectName);
    if (!existsSync(assetsDir)) {
        mkdirSync(assetsDir, { recursive: true });
    }

    const fileName = basename(filePath);
    const destPath = join(assetsDir, fileName);

    // 同名ファイルが存在する場合はタイムスタンプを付与
    let finalPath = destPath;
    if (existsSync(destPath)) {
        const ext = extname(fileName);
        const name = basename(fileName, ext);
        const timestamp = Date.now();
        finalPath = join(assetsDir, `${name}_${timestamp}${ext}`);
    }

    copyFileSync(filePath, finalPath);
    console.log(`✓ ファイルを追加しました: ${finalPath}`);
}

/**
 * ファイル内容をメモに追加
 */
function addFileContent(
    projectRoot: string,
    projectName: string,
    dateStr: string,
    filePath: string,
    lineRange?: string,
): void {
    if (!existsSync(filePath)) {
        console.error(`エラー: ファイルが見つかりません: ${filePath}`);
        process.exit(1);
    }

    const content = readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    // 行範囲をパース
    let startLine = 1;
    let endLine = lines.length;

    if (lineRange) {
        const rangeParts = lineRange.split("-");
        startLine = parseInt(rangeParts[0] || "1", 10);
        endLine = rangeParts[1] ? parseInt(rangeParts[1], 10) : startLine;
    }

    // 行番号を0ベースに変換
    const selectedLines = lines.slice(startLine - 1, endLine);
    const selectedContent = selectedLines.join("\n");

    // 言語を推測
    const ext = extname(filePath).toLowerCase();
    const language = EXTENSION_TO_LANGUAGE[ext] || "";

    // メモセクションにコードブロックを追加
    const dailyContent = readDailyFile(projectRoot, projectName, dateStr);
    const memoLines = dailyContent.split("\n");

    // Memoセクションを探す
    let memoSectionIndex = -1;
    let insertIndex = -1;

    for (let i = 0; i < memoLines.length; i++) {
        if (memoLines[i]?.match(/^##\s+Memo/i)) {
            memoSectionIndex = i;
            insertIndex = i + 1;

            for (let j = i + 1; j < memoLines.length; j++) {
                if (memoLines[j]?.match(/^##\s+/)) {
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

    // コードブロックを挿入
    const codeBlock = [
        `<!-- ${basename(filePath)}:${startLine}-${endLine} -->`,
        `\`\`\`${language}`,
        selectedContent,
        "```",
        "",
    ];

    memoLines.splice(insertIndex, 0, ...codeBlock);
    writeDailyFile(projectRoot, memoLines.join("\n"), projectName, dateStr);

    console.log(`✓ ファイル内容をメモに追加しました: ${filePath}:${startLine}-${endLine}`);
}
