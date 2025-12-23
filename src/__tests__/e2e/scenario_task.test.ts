/**
 * E2E シナリオテスト: タスク管理
 *
 * 複数タスクの操作とオプション動作を検証:
 * todo × 3 → done --first → done --last → done --all
 */

import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import {
    initProjectWithCommand,
    runHibi,
    setupTestEnv,
    teardownTestEnv,
} from "../helpers/test-utils";

describe("E2E: タスク管理", () => {
    let testDir: string;

    beforeEach(() => {
        testDir = setupTestEnv("hibi-e2e-task");
        initProjectWithCommand(testDir, ["--no-git"]);
    });

    afterEach(() => {
        teardownTestEnv(testDir);
    });

    it("done --first で最初のタスクを完了", () => {
        runHibi(["todo", "タスク1"], testDir);
        runHibi(["todo", "タスク2"], testDir);
        runHibi(["todo", "タスク3"], testDir);

        const doneResult = runHibi(["done", "--first"], testDir);
        expect(doneResult.exitCode).toBe(0);
        expect(doneResult.stdout).toContain("タスク1");

        // -a で完了済みも表示
        const listResult = runHibi(["list", "-a"], testDir);
        expect(listResult.stdout).toMatch(/✓.*タスク1/);
        expect(listResult.stdout).toMatch(/○.*タスク2/);
        expect(listResult.stdout).toMatch(/○.*タスク3/);
    });

    it("done --last で最後のタスクを完了", () => {
        runHibi(["todo", "タスク1"], testDir);
        runHibi(["todo", "タスク2"], testDir);
        runHibi(["todo", "タスク3"], testDir);

        const doneResult = runHibi(["done", "--last"], testDir);
        expect(doneResult.exitCode).toBe(0);
        expect(doneResult.stdout).toContain("タスク3");

        const listResult = runHibi(["list", "-a"], testDir);
        expect(listResult.stdout).toMatch(/○.*タスク1/);
        expect(listResult.stdout).toMatch(/○.*タスク2/);
        expect(listResult.stdout).toMatch(/✓.*タスク3/);
    });

    it("done --all で全タスクを完了", () => {
        runHibi(["todo", "タスク1"], testDir);
        runHibi(["todo", "タスク2"], testDir);
        runHibi(["todo", "タスク3"], testDir);

        const doneResult = runHibi(["done", "--all"], testDir);
        expect(doneResult.exitCode).toBe(0);
        expect(doneResult.stdout).toContain("3件のタスクを完了しました");

        const listResult = runHibi(["list", "-a"], testDir);
        expect(listResult.stdout).toMatch(/✓.*タスク1/);
        expect(listResult.stdout).toMatch(/✓.*タスク2/);
        expect(listResult.stdout).toMatch(/✓.*タスク3/);
    });

    it("連続して done オプションを使用", () => {
        // 5つのタスクを登録
        for (let i = 1; i <= 5; i++) {
            runHibi(["todo", `タスク${i}`], testDir);
        }

        // --first で最初を完了 (タスク1)
        runHibi(["done", "--first"], testDir);

        // --last で最後を完了 (タスク5)
        runHibi(["done", "--last"], testDir);

        // -a オプションで確認
        const listResult = runHibi(["list", "-a"], testDir);
        expect(listResult.stdout).toMatch(/✓.*タスク1/);
        expect(listResult.stdout).toMatch(/○.*タスク2/);
        expect(listResult.stdout).toMatch(/○.*タスク3/);
        expect(listResult.stdout).toMatch(/○.*タスク4/);
        expect(listResult.stdout).toMatch(/✓.*タスク5/);

        // --all で残りを完了
        const doneAllResult = runHibi(["done", "--all"], testDir);
        expect(doneAllResult.stdout).toContain("3件のタスクを完了しました");
    });

    it("存在しないタスクを done しようとするとエラー", () => {
        runHibi(["todo", "実在タスク"], testDir);

        const result = runHibi(["done", "架空タスク"], testDir);
        expect(result.stderr).toContain("タスクが見つかりません");
    });

    it("タスクがない状態で done --first すると警告メッセージ", () => {
        const result = runHibi(["done", "--first"], testDir);
        // exitCode 0 だが stderr か stdout に警告が出る可能性
        // CLI の実装によって異なるので、どちらかにメッセージがあることを確認
        const output = result.stdout + result.stderr;
        expect(output.length).toBeGreaterThan(0); // 何かしらの出力がある
    });

    // ========================================
    // 子タスク (--parent/-p) のテスト
    // ========================================

    it("todo --parent で子タスクを追加", () => {
        // 親タスクを追加
        runHibi(["todo", "親タスク"], testDir);

        // 子タスクを追加 (ID=1)
        const result = runHibi(["todo", "--parent", "1", "子タスク"], testDir);
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain("子タスクを追加しました");
        expect(result.stdout).toContain("親ID: 1");

        // リストで確認
        const listResult = runHibi(["list"], testDir);
        expect(listResult.stdout).toContain("親タスク");
        expect(listResult.stdout).toContain("子タスク");
    });

    it("todo -p で子タスクを追加（短縮形）", () => {
        runHibi(["todo", "親タスク"], testDir);

        const result = runHibi(["todo", "-p", "1", "短縮形テスト"], testDir);
        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain("子タスクを追加しました");
    });

    it("todo --parent で存在しないIDを指定するとエラー", () => {
        runHibi(["todo", "タスク1"], testDir);

        const result = runHibi(["todo", "--parent", "999", "子タスク"], testDir);
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain("999");
    });

    it("todo -p で複数の子タスクを追加", () => {
        runHibi(["todo", "親タスク"], testDir);
        runHibi(["todo", "-p", "1", "子タスク1"], testDir);
        runHibi(["todo", "-p", "1", "子タスク2"], testDir);

        // viewでマークダウン構造を確認
        const viewResult = runHibi(["view", "-t"], testDir);
        expect(viewResult.stdout).toContain("親タスク");
        expect(viewResult.stdout).toContain("子タスク1");
        expect(viewResult.stdout).toContain("子タスク2");
    });
});
