/**
 * E2E シナリオテスト: 同期機能
 *
 * ローカル bare リポジトリを使った同期フロー検証:
 * init (with git) → todo → sync
 */

import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import {
    createBareRepo,
    initProjectWithCommand,
    runHibi,
    setupTestEnv,
    teardownTestEnv,
} from "../helpers/test-utils";

describe("E2E: 同期機能", () => {
    let testDir: string;

    beforeEach(() => {
        testDir = setupTestEnv("hibi-e2e-sync");
    });

    afterEach(() => {
        teardownTestEnv(testDir);
    });

    it("sync --push でリモートに変更をプッシュ", () => {
        // bare リポジトリを作成
        const remoteDir = createBareRepo(testDir);

        // 作業ディレクトリを作成
        const workDir = join(testDir, "work");
        mkdirSync(workDir, { recursive: true });

        // hibi init (Git も初期化)
        const initResult = initProjectWithCommand(workDir);
        expect(initResult.exitCode).toBe(0);

        // Git リモートを設定
        spawnSync("git", ["remote", "add", "origin", remoteDir], { cwd: workDir });

        // タスクを追加
        runHibi(["todo", "同期テストタスク"], workDir);

        // 初回コミット
        spawnSync("git", ["add", "."], { cwd: workDir });
        spawnSync("git", ["commit", "-m", "Initial commit"], { cwd: workDir });

        // sync --push
        const syncResult = runHibi(["sync", "--push"], workDir);
        expect(syncResult.exitCode).toBe(0);
    });

    it("sync でコミットとプッシュが行われる", () => {
        // bare リポジトリを作成
        const remoteDir = createBareRepo(testDir);

        // 作業ディレクトリを作成して初期化
        const workDir = join(testDir, "work");
        mkdirSync(workDir, { recursive: true });
        initProjectWithCommand(workDir);

        // Git リモートを設定
        spawnSync("git", ["remote", "add", "origin", remoteDir], { cwd: workDir });

        // 初回コミットとプッシュ
        spawnSync("git", ["add", "."], { cwd: workDir });
        spawnSync("git", ["commit", "-m", "Initial"], { cwd: workDir });
        spawnSync("git", ["push", "-u", "origin", "master"], { cwd: workDir });

        // タスクを追加（未コミットの変更を作る）
        runHibi(["todo", "同期対象タスク"], workDir);

        // sync を実行
        const syncResult = runHibi(["sync"], workDir);
        expect(syncResult.exitCode).toBe(0);
        expect(syncResult.stdout).toContain("同期");
    });

    it("未初期化ディレクトリで sync するとエラー", () => {
        const emptyDir = join(testDir, "empty");
        mkdirSync(emptyDir, { recursive: true });

        const result = runHibi(["sync"], emptyDir);
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain("hibiプロジェクトが見つかりません");
    });
});
