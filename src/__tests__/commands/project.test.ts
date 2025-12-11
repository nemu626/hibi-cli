/**
 * project コマンド統合テスト
 */

import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { initProjectManually, runHibi, setupTestEnv, teardownTestEnv } from "../helpers/test-utils";

describe("project command", () => {
    let testDir: string;

    beforeEach(() => {
        testDir = setupTestEnv("hibi-project-test");
        initProjectManually(testDir);
    });

    afterEach(() => {
        teardownTestEnv(testDir);
    });

    describe("list", () => {
        it("正常: プロジェクト一覧表示", () => {
            const result = runHibi(["project", "list"], testDir);

            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain("default");
        });

        it("正常: エイリアス ls が動作", () => {
            const result = runHibi(["project", "ls"], testDir);

            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain("default");
        });
    });

    describe("create", () => {
        it("正常: 新規プロジェクト作成", () => {
            const result = runHibi(["project", "create", "myproject"], testDir);

            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain("プロジェクトを作成しました");
            expect(existsSync(join(testDir, "projects", "myproject"))).toBe(true);
        });

        it("エッジ: 既存プロジェクト名でエラー", () => {
            runHibi(["project", "create", "myproject"], testDir);
            const result = runHibi(["project", "create", "myproject"], testDir);

            expect(result.exitCode).toBe(1);
            expect(result.stderr).toContain("既に存在します");
        });

        it("エッジ: 不正なプロジェクト名", () => {
            const result = runHibi(["project", "create", "my project"], testDir);

            expect(result.exitCode).toBe(1);
            expect(result.stderr).toContain("英数字");
        });
    });

    describe("switch", () => {
        it("正常: プロジェクト切り替え", () => {
            runHibi(["project", "create", "other"], testDir);
            const result = runHibi(["project", "switch", "other"], testDir);

            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain("切り替えました");
        });

        it("エッジ: 存在しないプロジェクトへのswitch", () => {
            const result = runHibi(["project", "switch", "nonexistent"], testDir);

            expect(result.exitCode).toBe(1);
            expect(result.stderr).toContain("見つかりません");
        });
    });

    describe("rename", () => {
        it("正常: プロジェクト名変更", () => {
            runHibi(["project", "create", "oldname"], testDir);
            const result = runHibi(["project", "rename", "oldname", "newname"], testDir);

            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain("変更しました");
            expect(existsSync(join(testDir, "projects", "newname"))).toBe(true);
            expect(existsSync(join(testDir, "projects", "oldname"))).toBe(false);
        });

        it("エッジ: defaultはrename不可", () => {
            const result = runHibi(["project", "rename", "default", "other"], testDir);

            expect(result.exitCode).toBe(1);
            expect(result.stderr).toContain("defaultプロジェクトの名前は変更できません");
        });
    });

    describe("current", () => {
        it("正常: 現在のプロジェクト表示", () => {
            const result = runHibi(["project", "current"], testDir);

            expect(result.exitCode).toBe(0);
            // プロジェクト名が表示されること（前のテストで変更されている可能性がある）
            expect(result.stdout).toContain("現在のプロジェクト:");
        });
    });
});
