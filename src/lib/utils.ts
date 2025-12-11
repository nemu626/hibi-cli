/**
 * Hibi CLI - ユーティリティ関数
 */

import { existsSync } from "fs";
import { homedir } from "os";
import { join, dirname, parse } from "path";

/**
 * 今日の日付をYYYYMMDD形式で取得
 */
export function getTodayString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
}

/**
 * YYYYMMDD形式をYYYY-MM-DD形式に変換
 */
export function formatDateString(dateStr: string): string {
    if (dateStr.length !== 8) return dateStr;
    return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
}

/**
 * グローバル設定ディレクトリのパスを取得
 */
export function getGlobalConfigDir(): string {
    return join(homedir(), ".config", "hibi");
}

/**
 * グローバル設定ファイルのパスを取得
 */
export function getGlobalConfigPath(): string {
    return join(getGlobalConfigDir(), "hibi.yaml");
}

/**
 * プロジェクトルートを探す（hibi.yamlがあるディレクトリを上に向かって探索）
 * Windows/Linux両対応
 */
export function findProjectRoot(startDir: string = process.cwd()): string | null {
    let currentDir = startDir;

    // ルートディレクトリに到達するまで探索
    while (parse(currentDir).root !== currentDir) {
        const configPath = join(currentDir, "hibi.yaml");
        if (existsSync(configPath)) {
            return currentDir;
        }
        currentDir = dirname(currentDir);
    }

    return null;
}

/**
 * 現在のプロジェクトの日報ディレクトリパスを取得
 */
export function getDailyDir(projectRoot: string, projectName: string = "default"): string {
    return join(projectRoot, "projects", projectName, "daily");
}

/**
 * 現在のプロジェクトのassetsディレクトリパスを取得
 */
export function getAssetsDir(projectRoot: string, projectName: string = "default"): string {
    return join(projectRoot, "projects", projectName, "assets");
}

/**
 * 日報ファイルのパスを取得
 */
export function getDailyFilePath(
    projectRoot: string,
    projectName: string = "default",
    dateStr: string = getTodayString()
): string {
    return join(getDailyDir(projectRoot, projectName), `${dateStr}.md`);
}
