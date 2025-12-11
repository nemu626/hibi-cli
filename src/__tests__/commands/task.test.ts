/**
 * todo / done / list コマンド統合テスト
 */

import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { initProjectManually, runHibi, setupTestEnv, teardownTestEnv } from "../helpers/test-utils";

describe("todo command", () => {
    let testDir: string;

    beforeEach(() => {
        testDir = setupTestEnv("hibi-todo-test");
        initProjectManually(testDir);
    });

    afterEach(() => {
        teardownTestEnv(testDir);
    });

    it("正常: タスク追加", () => {
        const result = runHibi(["todo", "テストタスク"], testDir);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain("タスクを追加しました");
    });

    it("正常: 複数単語のタスク追加", () => {
        const result = runHibi(["todo", "これは", "複数", "単語です"], testDir);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain("これは 複数 単語です");
    });

    it("エッジ: プロジェクト未初期化でエラー", () => {
        const emptyDir = setupTestEnv("hibi-empty");

        const result = runHibi(["todo", "タスク"], emptyDir);

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain("hibiプロジェクトが見つかりません");

        teardownTestEnv(emptyDir);
    });
});

describe("list command", () => {
    let testDir: string;

    beforeEach(() => {
        testDir = setupTestEnv("hibi-list-test");
        initProjectManually(testDir);
    });

    afterEach(() => {
        teardownTestEnv(testDir);
    });

    it("正常: タスク一覧表示", () => {
        runHibi(["todo", "タスク1"], testDir);
        runHibi(["todo", "タスク2"], testDir);

        const result = runHibi(["list"], testDir);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain("タスク1");
        expect(result.stdout).toContain("タスク2");
        expect(result.stdout).toContain("Todo");
    });

    it("正常: タスクなしの場合", () => {
        const result = runHibi(["list"], testDir);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain("タスクはありません");
    });

    it("正常: エイリアス l が動作", () => {
        runHibi(["todo", "タスク"], testDir);
        const result = runHibi(["l"], testDir);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain("タスク");
    });
});

describe("done command", () => {
    let testDir: string;

    beforeEach(() => {
        testDir = setupTestEnv("hibi-done-test");
        initProjectManually(testDir);
        runHibi(["todo", "タスクA"], testDir);
        runHibi(["todo", "タスクB"], testDir);
        runHibi(["todo", "タスクC"], testDir);
    });

    afterEach(() => {
        teardownTestEnv(testDir);
    });

    it("正常: 部分一致で完了", () => {
        const result = runHibi(["done", "タスクA"], testDir);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain("タスクを完了しました");
    });

    it("正常: --last で最後のタスクを完了", () => {
        const result = runHibi(["done", "--last"], testDir);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain("タスクC");
    });

    it("正常: --first で最初のタスクを完了", () => {
        const result = runHibi(["done", "--first"], testDir);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain("タスクA");
    });

    it("正常: --all で全タスクを完了", () => {
        const result = runHibi(["done", "--all"], testDir);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain("3件のタスクを完了しました");
    });

    it("エッジ: 存在しないタスク", () => {
        const result = runHibi(["done", "存在しないタスク"], testDir);

        expect(result.exitCode).toBe(0);
        expect(result.stderr).toContain("タスクが見つかりません");
    });

    it("正常: エイリアス d が動作", () => {
        const result = runHibi(["d", "--last"], testDir);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain("タスクを完了しました");
    });
});
