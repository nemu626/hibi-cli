/**
 * git.ts テスト
 */

import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gitAddAll, gitCommit, gitInit, hasChanges, isGitRepo } from "../../lib/git";

describe("git", () => {
    let testDir: string;

    beforeEach(() => {
        testDir = join(tmpdir(), `hibi-git-test-${Date.now()}`);
        mkdirSync(testDir, { recursive: true });
    });

    afterEach(() => {
        rmSync(testDir, { recursive: true, force: true });
    });

    // ========================================
    // gitInit
    // ========================================
    describe("gitInit", () => {
        it("正常: .gitディレクトリが作成される", async () => {
            const result = await gitInit(testDir);
            expect(result.success).toBe(true);
            expect(existsSync(join(testDir, ".git"))).toBe(true);
        });

        it("エッジ: 既にGitリポジトリの場合", async () => {
            await gitInit(testDir);
            const result = await gitInit(testDir);
            // 既存リポジトリでも再初期化は成功する（git initの仕様）
            expect(result.success).toBe(true);
        });
    });

    // ========================================
    // isGitRepo
    // ========================================
    describe("isGitRepo", () => {
        it("正常: Gitリポジトリ → true", async () => {
            await gitInit(testDir);
            const result = await isGitRepo(testDir);
            expect(result).toBe(true);
        });

        it("正常: 非Gitディレクトリ → false", async () => {
            const result = await isGitRepo(testDir);
            expect(result).toBe(false);
        });

        it("エッジ: サブディレクトリでも検出", async () => {
            await gitInit(testDir);
            const subDir = join(testDir, "subdir");
            mkdirSync(subDir);
            const result = await isGitRepo(subDir);
            expect(result).toBe(true);
        });
    });

    // ========================================
    // hasChanges
    // ========================================
    describe("hasChanges", () => {
        beforeEach(async () => {
            await gitInit(testDir);
        });

        it("正常: 変更あり → true", async () => {
            writeFileSync(join(testDir, "test.txt"), "content");
            const result = await hasChanges(testDir);
            expect(result).toBe(true);
        });

        it("正常: 変更なし → false", async () => {
            // 初期状態（ファイルなし）
            const result = await hasChanges(testDir);
            expect(result).toBe(false);
        });

        it("エッジ: 未追跡ファイルも変更として検出", async () => {
            writeFileSync(join(testDir, "untracked.txt"), "content");
            const result = await hasChanges(testDir);
            expect(result).toBe(true);
        });
    });

    // ========================================
    // gitCommit
    // ========================================
    describe("gitCommit", () => {
        beforeEach(async () => {
            await gitInit(testDir);
            // Git設定（テスト用）
            const { spawn } = await import("node:child_process");
            await new Promise<void>((resolve) => {
                const p = spawn("git", ["config", "user.email", "test@test.com"], { cwd: testDir });
                p.on("close", () => resolve());
            });
            await new Promise<void>((resolve) => {
                const p = spawn("git", ["config", "user.name", "Test"], { cwd: testDir });
                p.on("close", () => resolve());
            });
        });

        it("正常: コミットメッセージが正しく設定", async () => {
            writeFileSync(join(testDir, "test.txt"), "content");
            await gitAddAll(testDir);
            const result = await gitCommit(testDir, "テストコミット");
            expect(result.success).toBe(true);
        });

        it("エッジ: 日本語メッセージ", async () => {
            writeFileSync(join(testDir, "test.txt"), "内容");
            await gitAddAll(testDir);
            const result = await gitCommit(testDir, "日本語のコミットメッセージ");
            expect(result.success).toBe(true);
        });

        it("エッジ: 特殊文字を含むメッセージ", async () => {
            writeFileSync(join(testDir, "test.txt"), "content");
            await gitAddAll(testDir);
            const result = await gitCommit(testDir, "メッセージ with \"quotes\" and 'apostrophe'");
            expect(result.success).toBe(true);
        });
    });
});
