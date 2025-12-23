/**
 * Hibi CLI - edit コマンド
 * 日報ファイルをエディタで開く
 */

import { spawnSync } from "node:child_process";
import {
    existsSync,
    mkdtempSync,
    readFileSync,
    rmdirSync,
    unlinkSync,
    writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Command } from "commander";
import { loadConfig, requireProjectRoot } from "../lib/config";
import { ensureDailyFile, readDailyFile, writeDailyFile } from "../lib/daily";
import { getDailyFilePath, getTodayString } from "../lib/utils";

/**
 * editコマンドを作成
 */
export function createEditCommand(): Command {
    const command = new Command("edit")
        .alias("e")
        .description("日報ファイルをエディタで開く")
        .option("-d, --date <date>", "指定した日付の日報を編集 (YYYYMMDD)")
        .option("-m, --memo", "メモセクションのみを編集")
        .action((options: { date?: string; memo?: boolean }) => {
            if (options.memo) {
                editMemoSection(options);
            } else {
                editDaily(options);
            }
        });

    return command;
}

/**
 * 日報をエディタで開く
 */
function editDaily(options: { date?: string }): void {
    const projectRoot = requireProjectRoot();
    const config = loadConfig();
    const projectName = config.currentProject || "default";
    const dateStr = options.date || getTodayString();

    // エディタを決定
    const editor = config.editor || process.env.EDITOR || "vi";

    // 日報ファイルを確保
    ensureDailyFile(projectRoot, projectName, dateStr);
    const filePath = getDailyFilePath(projectRoot, projectName, dateStr);

    console.log(`エディタで開いています: ${filePath}`);

    // エディタを起動（同期）
    const result = spawnSync(editor, [filePath], {
        stdio: "inherit",
    });

    if (result.error) {
        console.error(`エラー: エディタの起動に失敗しました: ${result.error.message}`);
        console.log("ヒント: EDITOR環境変数を設定するか、hibi.yamlでeditorを指定してください");
        return;
    }

    if (result.status === 0) {
        console.log("✓ 編集が完了しました");
    }
}

/**
 * メモセクションのみをエディタで編集
 */
function editMemoSection(options: { date?: string }): void {
    const projectRoot = requireProjectRoot();
    const config = loadConfig();
    const projectName = config.currentProject || "default";
    const dateStr = options.date || getTodayString();

    // エディタを決定
    const editor = config.editor || process.env.EDITOR || "vi";

    // 日報ファイルを確保
    ensureDailyFile(projectRoot, projectName, dateStr);

    // 日報ファイルを読み込み
    const content = readDailyFile(projectRoot, projectName, dateStr);
    const lines = content.split("\n");

    // メモセクションを抽出
    let memoStartIndex = -1;
    let memoEndIndex = lines.length;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i]?.match(/^##\s+Memo/i)) {
            memoStartIndex = i + 1; // セクションヘッダーの次の行から
        } else if (memoStartIndex !== -1 && lines[i]?.match(/^##\s+/)) {
            memoEndIndex = i;
            break;
        }
    }

    if (memoStartIndex === -1) {
        console.error("エラー: Memoセクションが見つかりません");
        return;
    }

    // メモ内容を抽出
    const memoLines = lines.slice(memoStartIndex, memoEndIndex);
    const memoContent = memoLines.join("\n").trim();

    // 一時ファイルを作成
    const tempDir = mkdtempSync(join(tmpdir(), "hibi-memo-edit-"));
    const tempFile = join(tempDir, "memo.md");
    writeFileSync(tempFile, `${memoContent}\n`, "utf-8");

    console.log("メモセクションをエディタで編集しています...");

    // エディタを起動（同期）
    const result = spawnSync(editor, [tempFile], {
        stdio: "inherit",
    });

    if (result.error) {
        console.error(`エラー: エディタの起動に失敗しました: ${result.error.message}`);
        console.log("ヒント: EDITOR環境変数を設定するか、hibi.yamlでeditorを指定してください");
        cleanupTempFile(tempFile, tempDir);
        return;
    }

    if (result.status !== 0) {
        console.log("編集がキャンセルされました");
        cleanupTempFile(tempFile, tempDir);
        return;
    }

    // 編集後のメモ内容を読み込み
    const newMemoContent = readFileSync(tempFile, "utf-8").trim();

    // 一時ファイルを削除
    cleanupTempFile(tempFile, tempDir);

    // 日報ファイルを更新
    const beforeMemo = lines.slice(0, memoStartIndex);
    const afterMemo = lines.slice(memoEndIndex);
    const newLines = [...beforeMemo, newMemoContent ? newMemoContent : "", "", ...afterMemo];

    writeDailyFile(projectRoot, newLines.join("\n"), projectName, dateStr);
    console.log("✓ メモセクションを更新しました");
}

/**
 * 一時ファイルとディレクトリをクリーンアップ
 */
function cleanupTempFile(tempFile: string, tempDir: string): void {
    try {
        if (existsSync(tempFile)) {
            unlinkSync(tempFile);
        }
        if (existsSync(tempDir)) {
            rmdirSync(tempDir);
        }
    } catch {
        // クリーンアップエラーは無視
    }
}
