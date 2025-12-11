/**
 * E2E シナリオテスト: 基本ワークフロー
 *
 * 新規ユーザーの初回利用フローを検証:
 * init → todo → list → done → list
 */

import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
    initProjectWithCommand,
    runHibi,
    setupTestEnv,
    teardownTestEnv,
} from "../helpers/test-utils";

describe("E2E: 基本ワークフロー", () => {
    let testDir: string;

    beforeEach(() => {
        testDir = setupTestEnv("hibi-e2e-basic");
    });

    afterEach(() => {
        teardownTestEnv(testDir);
    });

    it("新規ユーザーの初回利用フロー: init → todo → list → done → list", () => {
        // Step 1: プロジェクト初期化
        const initResult = initProjectWithCommand(testDir, ["--no-git"]);
        expect(initResult.exitCode).toBe(0);
        expect(initResult.stdout).toContain("初期化が完了しました");
        expect(existsSync(join(testDir, "hibi.yaml"))).toBe(true);
        expect(existsSync(join(testDir, "projects", "default", "daily"))).toBe(true);

        // Step 2: タスク登録
        const todoResult = runHibi(["todo", "最初のタスク"], testDir);
        expect(todoResult.exitCode).toBe(0);
        expect(todoResult.stdout).toContain("タスクを追加しました");

        // Step 3: タスク一覧表示
        const listResult1 = runHibi(["list"], testDir);
        expect(listResult1.exitCode).toBe(0);
        expect(listResult1.stdout).toContain("最初のタスク");
        expect(listResult1.stdout).toContain("○"); // 未完了は○

        // Step 4: タスク完了
        const doneResult = runHibi(["done", "最初のタスク"], testDir);
        expect(doneResult.exitCode).toBe(0);
        expect(doneResult.stdout).toContain("タスクを完了しました");

        // Step 5: 完了後の一覧表示 (-a で完了済みも表示)
        const listResult2 = runHibi(["list", "-a"], testDir);
        expect(listResult2.exitCode).toBe(0);
        expect(listResult2.stdout).toContain("✓"); // 完了済みは✓

        // 日報ファイルの内容は list コマンドの出力で間接的に確認済み
        // ファイルシステムの直接確認はスキップ（パス解決の複雑さを避ける）
    });

    it("複数タスクの登録と個別完了", () => {
        // 初期化
        initProjectWithCommand(testDir, ["--no-git"]);

        // 3つのタスクを登録
        runHibi(["todo", "タスク A"], testDir);
        runHibi(["todo", "タスク B"], testDir);
        runHibi(["todo", "タスク C"], testDir);

        // 一覧で3つ確認
        const listResult1 = runHibi(["list"], testDir);
        expect(listResult1.stdout).toContain("タスク A");
        expect(listResult1.stdout).toContain("タスク B");
        expect(listResult1.stdout).toContain("タスク C");

        // B だけ完了
        const doneResult = runHibi(["done", "タスク B"], testDir);
        expect(doneResult.exitCode).toBe(0);

        // -a オプションで全タスク表示
        const listResult2 = runHibi(["list", "-a"], testDir);
        // A, C は未完了(○)、B は完了(✓)
        expect(listResult2.stdout).toMatch(/○.*タスク A/);
        expect(listResult2.stdout).toMatch(/✓.*タスク B/);
        expect(listResult2.stdout).toMatch(/○.*タスク C/);
    });

    it("エイリアスコマンドでも同様に動作する: t, l, d", () => {
        initProjectWithCommand(testDir, ["--no-git"]);

        // t = todo
        const todoResult = runHibi(["t", "エイリアステスト"], testDir);
        expect(todoResult.exitCode).toBe(0);

        // l = list
        const listResult = runHibi(["l"], testDir);
        expect(listResult.exitCode).toBe(0);
        expect(listResult.stdout).toContain("エイリアステスト");

        // d = done
        const doneResult = runHibi(["d", "エイリアステスト"], testDir);
        expect(doneResult.exitCode).toBe(0);
    });
});
