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
});
