/**
 * remote コマンド統合テスト
 */

import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { spawnSync } from "node:child_process";
import {
    initProjectWithCommand,
    runHibi,
    setupTestEnv,
    teardownTestEnv,
} from "../helpers/test-utils";

describe("remote command", () => {
    let testDir: string;

    beforeEach(() => {
        testDir = setupTestEnv("hibi-remote-test");
    });

    afterEach(() => {
        teardownTestEnv(testDir);
    });

    it("正常: remote add でリモートを追加", () => {
        // hibi プロジェクトを初期化
        initProjectWithCommand(testDir);

        // remote add を実行
        const result = runHibi(["remote", "add", "https://github.com/user/repo.git"], testDir);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain("リモート 'origin' を追加しました");

        // git remote -v で確認
        const gitResult = spawnSync("git", ["remote", "-v"], { cwd: testDir, encoding: "utf-8" });
        expect(gitResult.stdout).toContain("origin");
        expect(gitResult.stdout).toContain("https://github.com/user/repo.git");
    });

    it("正常: remote add <url> <name> で名前付きリモートを追加", () => {
        initProjectWithCommand(testDir);

        const result = runHibi(["remote", "add", "https://github.com/user/repo.git", "upstream"], testDir);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain("リモート 'upstream' を追加しました");

        // git remote -v で確認
        const gitResult = spawnSync("git", ["remote", "-v"], { cwd: testDir, encoding: "utf-8" });
        expect(gitResult.stdout).toContain("upstream");
    });

    it("エラー: 既にリモートが設定されている場合", () => {
        initProjectWithCommand(testDir);

        // 先に origin を追加
        spawnSync("git", ["remote", "add", "origin", "https://example.com/repo"], { cwd: testDir });

        // 同じ名前で追加しようとするとエラー
        const result = runHibi(["remote", "add", "https://github.com/user/repo.git"], testDir);

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain("既に設定されています");
    });

    it("エラー: Gitリポジトリではない場合", () => {
        // --no-git で初期化（Gitリポジトリなし）
        initProjectWithCommand(testDir, ["--no-git"]);

        const result = runHibi(["remote", "add", "https://github.com/user/repo.git"], testDir);

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain("Gitリポジトリではありません");
    });

    it("エラー: hibiプロジェクトではない場合", () => {
        // 空ディレクトリでテスト
        const result = runHibi(["remote", "add", "https://github.com/user/repo.git"], testDir);

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain("hibiプロジェクトが見つかりません");
    });

    it("正常: hibi r（エイリアス）でも動作", () => {
        initProjectWithCommand(testDir);

        const result = runHibi(["r", "add", "https://github.com/user/test.git"], testDir);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain("リモート");
    });
});
