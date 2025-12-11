/**
 * E2E シナリオテスト: プロジェクト管理
 *
 * プロジェクトの作成・切り替え・タスク分離を検証:
 * init → project create → project switch → todo → project switch → list
 *
 * 注意: project switch はグローバル設定を更新するため、
 * テスト実行後にデフォルト設定に戻す必要がある
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

describe("E2E: プロジェクト管理", () => {
    let testDir: string;

    beforeEach(() => {
        testDir = setupTestEnv("hibi-e2e-project");
        initProjectWithCommand(testDir, ["--no-git"]);
    });

    afterEach(() => {
        // デフォルトプロジェクトに戻す（グローバル設定のクリーンアップ）
        runHibi(["project", "switch", "default"], testDir);
        teardownTestEnv(testDir);
    });

    it("新しいプロジェクトを作成して切り替えできる", () => {
        // 新しいプロジェクトを作成
        const createResult = runHibi(["project", "create", "work"], testDir);
        expect(createResult.exitCode).toBe(0);
        expect(createResult.stdout).toContain("プロジェクトを作成しました");
        expect(existsSync(join(testDir, "projects", "work"))).toBe(true);

        // work プロジェクトに切り替え
        const switchResult = runHibi(["project", "switch", "work"], testDir);
        expect(switchResult.exitCode).toBe(0);
        expect(switchResult.stdout).toContain("切り替えました");

        // 現在のプロジェクトを確認
        const currentResult = runHibi(["project", "current"], testDir);
        expect(currentResult.stdout).toContain("work");
    });

    it("プロジェクト一覧に作成したプロジェクトが表示される", () => {
        runHibi(["project", "create", "projectA"], testDir);
        runHibi(["project", "create", "projectB"], testDir);

        const listResult = runHibi(["project", "list"], testDir);
        expect(listResult.exitCode).toBe(0);
        expect(listResult.stdout).toContain("default");
        expect(listResult.stdout).toContain("projectA");
        expect(listResult.stdout).toContain("projectB");
    });

    it("現在のプロジェクトが正しく表示される", () => {
        runHibi(["project", "create", "myproject"], testDir);
        runHibi(["project", "switch", "myproject"], testDir);

        const currentResult = runHibi(["project", "current"], testDir);
        expect(currentResult.stdout).toContain("myproject");
    });

    it("プロジェクト名の変更が正しく動作する", () => {
        runHibi(["project", "create", "oldname"], testDir);
        runHibi(["project", "switch", "oldname"], testDir);
        runHibi(["todo", "リネームテスト"], testDir);

        // リネーム
        const renameResult = runHibi(["project", "rename", "oldname", "newname"], testDir);
        expect(renameResult.exitCode).toBe(0);
        expect(renameResult.stdout).toContain("変更しました");

        // 新しい名前で切り替え
        runHibi(["project", "switch", "newname"], testDir);

        // タスクが維持されている
        const listResult = runHibi(["list"], testDir);
        expect(listResult.stdout).toContain("リネームテスト");

        // 古い名前は存在しない
        expect(existsSync(join(testDir, "projects", "oldname"))).toBe(false);
        expect(existsSync(join(testDir, "projects", "newname"))).toBe(true);
    });

    it("存在しないプロジェクトへの切り替えはエラー", () => {
        const result = runHibi(["project", "switch", "nonexistent"], testDir);
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain("見つかりません");
    });

    it("defaultプロジェクトはリネーム不可", () => {
        const result = runHibi(["project", "rename", "default", "other"], testDir);
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain("defaultプロジェクトの名前は変更できません");
    });

    it("不正なプロジェクト名でエラー", () => {
        const result = runHibi(["project", "create", "my project"], testDir);
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain("英数字");
    });
});
