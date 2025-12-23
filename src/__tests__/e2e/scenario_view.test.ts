/**
 * E2E シナリオテスト: viewコマンド
 *
 * 日報のMarkdown表示機能を検証:
 * hibi view, hibi view --todo, hibi view --memo
 */

import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import {
    initProjectWithCommand,
    runHibi,
    setupTestEnv,
    teardownTestEnv,
} from "../helpers/test-utils";

describe("E2E: viewコマンド", () => {
    let testDir: string;

    beforeEach(() => {
        testDir = setupTestEnv("hibi-e2e-view");
    });

    afterEach(() => {
        teardownTestEnv(testDir);
    });

    it("view: Markdown全体を出力", () => {
        // 初期化
        initProjectWithCommand(testDir, ["--no-git"]);

        // タスクとメモを追加
        runHibi(["todo", "テストタスク1"], testDir);
        runHibi(["todo", "テストタスク2"], testDir);
        runHibi(["memo", "テストメモ1"], testDir);
        runHibi(["memo", "テストメモ2"], testDir);

        // 全体を表示
        const viewResult = runHibi(["view"], testDir);
        expect(viewResult.exitCode).toBe(0);

        // タイトル（日付）が含まれる
        expect(viewResult.stdout).toMatch(/# \d{4}-\d{2}-\d{2}/);

        // セクションヘッダーが含まれる
        expect(viewResult.stdout).toContain("## Todo");
        expect(viewResult.stdout).toContain("## Memo");
        expect(viewResult.stdout).toContain("## Summary by LLM");

        // タスクが含まれる
        expect(viewResult.stdout).toContain("[ ] テストタスク1");
        expect(viewResult.stdout).toContain("[ ] テストタスク2");

        // メモが含まれる
        expect(viewResult.stdout).toContain("テストメモ1");
        expect(viewResult.stdout).toContain("テストメモ2");
    });

    it("view --todo: Todoセクションのみを表示", () => {
        // 初期化
        initProjectWithCommand(testDir, ["--no-git"]);

        // タスクとメモを追加
        runHibi(["todo", "Todoセクションのタスク"], testDir);
        runHibi(["memo", "Memoセクションのメモ"], testDir);

        // --todo オプションで表示
        const viewResult = runHibi(["view", "--todo"], testDir);
        expect(viewResult.exitCode).toBe(0);

        // Todoセクションが含まれる
        expect(viewResult.stdout).toContain("## Todo");
        expect(viewResult.stdout).toContain("Todoセクションのタスク");

        // Memoセクションは含まれない
        expect(viewResult.stdout).not.toContain("## Memo");
        expect(viewResult.stdout).not.toContain("Memoセクションのメモ");
    });

    it("view --memo: Memoセクションのみを表示", () => {
        // 初期化
        initProjectWithCommand(testDir, ["--no-git"]);

        // タスクとメモを追加
        runHibi(["todo", "Todoセクションのタスク"], testDir);
        runHibi(["memo", "Memoセクションのメモ"], testDir);

        // --memo オプションで表示
        const viewResult = runHibi(["view", "--memo"], testDir);
        expect(viewResult.exitCode).toBe(0);

        // Memoセクションが含まれる
        expect(viewResult.stdout).toContain("## Memo");
        expect(viewResult.stdout).toContain("Memoセクションのメモ");

        // Todoセクションは含まれない
        expect(viewResult.stdout).not.toContain("## Todo");
        expect(viewResult.stdout).not.toContain("Todoセクションのタスク");
    });

    it("view -t: --todoの短縮形", () => {
        // 初期化
        initProjectWithCommand(testDir, ["--no-git"]);

        runHibi(["todo", "短縮形テスト用タスク"], testDir);

        // -t オプションで表示
        const viewResult = runHibi(["view", "-t"], testDir);
        expect(viewResult.exitCode).toBe(0);
        expect(viewResult.stdout).toContain("## Todo");
        expect(viewResult.stdout).toContain("短縮形テスト用タスク");
    });

    it("view -m: --memoの短縮形", () => {
        // 初期化
        initProjectWithCommand(testDir, ["--no-git"]);

        runHibi(["memo", "短縮形テスト用メモ"], testDir);

        // -m オプションで表示
        const viewResult = runHibi(["view", "-m"], testDir);
        expect(viewResult.exitCode).toBe(0);
        expect(viewResult.stdout).toContain("## Memo");
        expect(viewResult.stdout).toContain("短縮形テスト用メモ");
    });

    it("view --date: 指定日付の日報を表示", () => {
        // 初期化
        initProjectWithCommand(testDir, ["--no-git"]);

        // 今日のタスクを追加
        runHibi(["todo", "今日のタスク"], testDir);

        // 今日の日報を表示
        const viewResult = runHibi(["view"], testDir);
        expect(viewResult.exitCode).toBe(0);
        expect(viewResult.stdout).toContain("今日のタスク");

        // 存在しない日付を指定すると空の日報が作成される
        const viewResult2 = runHibi(["view", "--date", "20251201"], testDir);
        expect(viewResult2.exitCode).toBe(0);
        expect(viewResult2.stdout).toContain("# 2025-12-01");
        // 空の日報にはTodoセクションがあるがタスクはない
        expect(viewResult2.stdout).toContain("## Todo");
        expect(viewResult2.stdout).not.toContain("今日のタスク");
    });

    it("view エイリアス v が動作", () => {
        // 初期化
        initProjectWithCommand(testDir, ["--no-git"]);

        runHibi(["todo", "エイリアステスト用タスク"], testDir);

        // v エイリアスで表示
        const viewResult = runHibi(["v"], testDir);
        expect(viewResult.exitCode).toBe(0);
        expect(viewResult.stdout).toContain("## Todo");
        expect(viewResult.stdout).toContain("エイリアステスト用タスク");
    });

    it("view --todo と --memo は同時に指定できない（--todo が優先）", () => {
        // 初期化
        initProjectWithCommand(testDir, ["--no-git"]);

        runHibi(["todo", "タスク"], testDir);
        runHibi(["memo", "メモ"], testDir);

        // 両方指定（先に評価される --todo が優先）
        const viewResult = runHibi(["view", "--todo", "--memo"], testDir);
        expect(viewResult.exitCode).toBe(0);
        // 現在の実装では --todo が優先される
        expect(viewResult.stdout).toContain("## Todo");
    });
});
