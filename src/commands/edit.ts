/**
 * Hibi CLI - edit コマンド
 * 日報ファイルをエディタで開く
 */

import { Command } from "commander";
import { spawn } from "child_process";
import { loadConfig, requireProjectRoot } from "../lib/config";
import { ensureDailyFile } from "../lib/daily";
import { getTodayString, getDailyFilePath } from "../lib/utils";

/**
 * editコマンドを作成
 */
export function createEditCommand(): Command {
    const command = new Command("edit")
        .alias("e")
        .description("日報ファイルをエディタで開く")
        .option("-d, --date <date>", "指定した日付の日報を編集 (YYYYMMDD)")
        .action((options: { date?: string }) => {
            editDaily(options);
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

    // エディタを起動
    const child = spawn(editor, [filePath], {
        stdio: "inherit",
    });

    child.on("error", (error) => {
        console.error(`エラー: エディタの起動に失敗しました: ${error.message}`);
        console.log(`ヒント: EDITOR環境変数を設定するか、hibi.yamlでeditorを指定してください`);
    });

    child.on("exit", (code) => {
        if (code === 0) {
            console.log("✓ 編集が完了しました");
        }
    });
}

