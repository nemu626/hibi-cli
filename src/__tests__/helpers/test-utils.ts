/**
 * 共通テストユーティリティ
 *
 * E2E テストおよび統合テストで使用する共通関数を提供
 */

import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CLI_PATH = join(import.meta.dir, "../../index.ts");

export interface HibiResult {
    stdout: string;
    stderr: string;
    exitCode: number;
}

/**
 * hibi コマンドを実行する
 */
export function runHibi(args: string[], cwd: string): HibiResult {
    const result = spawnSync("bun", ["run", CLI_PATH, ...args], {
        cwd,
        encoding: "utf-8",
    });
    return {
        stdout: result.stdout || "",
        stderr: result.stderr || "",
        exitCode: result.status ?? 1,
    };
}

/**
 * テスト用の一時ディレクトリを作成する
 */
export function setupTestEnv(prefix = "hibi-test"): string {
    const testDir = join(tmpdir(), `${prefix}-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    return testDir;
}

/**
 * テスト用ディレクトリをクリーンアップする
 */
export function teardownTestEnv(dir: string): void {
    rmSync(dir, { recursive: true, force: true });
}

/**
 * hibi プロジェクトを手動で初期化する（init コマンドを使わない）
 */
export function initProjectManually(dir: string): void {
    mkdirSync(join(dir, "projects", "default", "daily"), { recursive: true });
    mkdirSync(join(dir, "projects", "default", "assets"), { recursive: true });
    writeFileSync(join(dir, "hibi.yaml"), "remote: origin\n");
}

/**
 * hibi init コマンドでプロジェクトを初期化する
 */
export function initProjectWithCommand(dir: string, options: string[] = []): HibiResult {
    return runHibi(["init", ".", ...options], dir);
}

/**
 * 日報ファイルのパスを取得する
 */
export function getDailyFilePath(dir: string, project = "default"): string {
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
    return join(dir, "projects", project, "daily", `${dateStr}.md`);
}

/**
 * テスト用の一時ファイルを作成する
 */
export function createTempFile(dir: string, filename: string, content: string): string {
    const filePath = join(dir, filename);
    writeFileSync(filePath, content);
    return filePath;
}

/**
 * Git bare リポジトリを作成する（sync テスト用）
 */
export function createBareRepo(dir: string): string {
    const bareDir = join(dir, "remote.git");
    mkdirSync(bareDir, { recursive: true });
    spawnSync("git", ["init", "--bare"], { cwd: bareDir });
    return bareDir;
}

/**
 * Git リポジトリとして初期化する
 */
export function initGitRepo(dir: string, remoteUrl?: string): void {
    spawnSync("git", ["init"], { cwd: dir });
    spawnSync("git", ["config", "user.email", "test@example.com"], { cwd: dir });
    spawnSync("git", ["config", "user.name", "Test User"], { cwd: dir });
    if (remoteUrl) {
        spawnSync("git", ["remote", "add", "origin", remoteUrl], { cwd: dir });
    }
}
