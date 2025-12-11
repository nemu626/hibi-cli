/**
 * init コマンド統合テスト
 */

import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CLI_PATH = join(import.meta.dir, "../../../src/index.ts");

function runHibi(
    args: string[],
    cwd: string,
): { stdout: string; stderr: string; exitCode: number } {
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

describe("init command", () => {
    let testDir: string;

    beforeEach(() => {
        testDir = join(tmpdir(), `hibi-init-test-${Date.now()}`);
        mkdirSync(testDir, { recursive: true });
    });

    afterEach(() => {
        rmSync(testDir, { recursive: true, force: true });
    });

    it("正常: ディレクトリ構造 + hibi.yaml作成", () => {
        const result = runHibi(["init", "."], testDir);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain("hibiプロジェクトの初期化が完了しました");
        expect(existsSync(join(testDir, "hibi.yaml"))).toBe(true);
        expect(existsSync(join(testDir, "projects", "default", "daily"))).toBe(true);
        expect(existsSync(join(testDir, "projects", "default", "assets"))).toBe(true);
    });

    it("正常: .gitignoreが作成される", () => {
        runHibi(["init", "."], testDir);

        const gitignorePath = join(testDir, ".gitignore");
        expect(existsSync(gitignorePath)).toBe(true);
        const content = readFileSync(gitignorePath, "utf-8");
        expect(content).toContain(".DS_Store");
    });

    it("エッジ: 既存プロジェクトでエラー", () => {
        // 初回
        runHibi(["init", "."], testDir);
        // 2回目
        const result = runHibi(["init", "."], testDir);

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain("既にhibiプロジェクトとして初期化されています");
    });

    it("エッジ: --no-git でGit初期化スキップ", () => {
        const result = runHibi(["init", ".", "--no-git"], testDir);

        expect(result.exitCode).toBe(0);
        expect(existsSync(join(testDir, ".git"))).toBe(false);
    });

    it("正常: サブディレクトリを指定して初期化", () => {
        const subDir = "myproject";
        const result = runHibi(["init", subDir], testDir);

        expect(result.exitCode).toBe(0);
        expect(existsSync(join(testDir, subDir, "hibi.yaml"))).toBe(true);
    });
});
