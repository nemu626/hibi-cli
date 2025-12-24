/**
 * init コマンド統合テスト
 */

import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { runHibi, setupTestEnv, teardownTestEnv } from "../helpers/test-utils";

describe("init command", () => {
    let testDir: string;

    beforeEach(() => {
        testDir = setupTestEnv("hibi-init-test");
    });

    afterEach(() => {
        teardownTestEnv(testDir);
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

    it("正常: --add-remote でリモートを設定", () => {
        const result = runHibi(["init", ".", "--add-remote", "https://github.com/user/repo.git"], testDir);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain("リモートを追加しました");

        // git remote -v で確認
        const { spawnSync } = require("node:child_process");
        const gitResult = spawnSync("git", ["remote", "-v"], { cwd: testDir, encoding: "utf-8" });
        expect(gitResult.stdout).toContain("origin");
        expect(gitResult.stdout).toContain("https://github.com/user/repo.git");
    });

    it("エラー: --no-git と --add-remote の組み合わせ", () => {
        const result = runHibi(["init", ".", "--no-git", "--add-remote", "https://example.com/repo"], testDir);

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain("--no-git と --add-remote は同時に使用できません");
    });
});

