/**
 * E2E シナリオテスト: メモ機能
 *
 * インラインメモとファイルメモの統合検証:
 * 注意: memoコマンドはMemoセクションがある日報ファイルが必要
 * そのため、先にtodoでファイルを作成しておく必要がある
 */

import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import {
    createTempFile,
    getDailyFilePath,
    initProjectWithCommand,
    runHibi,
    setupTestEnv,
    teardownTestEnv,
} from "../helpers/test-utils";

describe("E2E: メモ機能", () => {
    let testDir: string;

    beforeEach(() => {
        testDir = setupTestEnv("hibi-e2e-memo");
        initProjectWithCommand(testDir, ["--no-git"]);
        // 日報ファイルを作成するためにタスクを1つ追加
        runHibi(["todo", "ダミータスク"], testDir);
    });

    afterEach(() => {
        teardownTestEnv(testDir);
    });

    it("インラインメモを追加", () => {
        const memoResult = runHibi(["memo", "これはテストメモです"], testDir);
        expect(memoResult.exitCode).toBe(0);
        expect(memoResult.stdout).toContain("メモを追加しました");

        // 日報ファイルにメモが含まれているか確認
        const dailyPath = getDailyFilePath(testDir);
        expect(existsSync(dailyPath)).toBe(true);
        const content = readFileSync(dailyPath, "utf-8");
        expect(content).toContain("これはテストメモです");
        expect(content).toContain("## Memo");
    });

    it("複数のメモを連続して追加", () => {
        runHibi(["memo", "メモ1行目"], testDir);
        runHibi(["memo", "メモ2行目"], testDir);
        runHibi(["memo", "メモ3行目"], testDir);

        const dailyPath = getDailyFilePath(testDir);
        const content = readFileSync(dailyPath, "utf-8");
        expect(content).toContain("メモ1行目");
        expect(content).toContain("メモ2行目");
        expect(content).toContain("メモ3行目");
    });

    it("ファイルからメモを追加 (-f オプション)", () => {
        // テスト用ファイルを作成
        const testContent = `function hello() {
  console.log("Hello, World!");
}`;
        const filePath = createTempFile(testDir, "test.js", testContent);

        const memoResult = runHibi(["memo", "-f", filePath], testDir);
        expect(memoResult.exitCode).toBe(0);
        expect(memoResult.stdout).toContain("ファイル内容をメモに追加しました");

        // 日報ファイルにファイル内容が含まれているか確認
        const dailyPath = getDailyFilePath(testDir);
        const content = readFileSync(dailyPath, "utf-8");
        expect(content).toContain("Hello, World!");
        expect(content).toContain("```"); // コードブロック
    });

    it("タスクとメモを組み合わせたワークフロー", () => {
        // タスクを追加
        runHibi(["todo", "調査タスク"], testDir);

        // 調査中にメモを残す
        runHibi(["memo", "調査結果: APIのレート制限が問題"], testDir);

        // タスク完了
        runHibi(["done", "調査タスク"], testDir);

        // 完了後にもメモを残す
        runHibi(["memo", "次回への申し送り: レート制限の回避策を検討"], testDir);

        // 日報に全て含まれていることを確認
        const dailyPath = getDailyFilePath(testDir);
        const content = readFileSync(dailyPath, "utf-8");
        expect(content).toContain("[x] 調査タスク");
        expect(content).toContain("調査結果");
        expect(content).toContain("次回への申し送り");
    });

    it("存在しないファイルを指定するとエラー", () => {
        const result = runHibi(["memo", "-f", "/nonexistent/file.txt"], testDir);
        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain("ファイルが見つかりません");
    });

    it("エイリアス m が動作", () => {
        const result = runHibi(["m", "エイリアスメモ"], testDir);
        expect(result.exitCode).toBe(0);

        const dailyPath = getDailyFilePath(testDir);
        const content = readFileSync(dailyPath, "utf-8");
        expect(content).toContain("エイリアスメモ");
    });
});
