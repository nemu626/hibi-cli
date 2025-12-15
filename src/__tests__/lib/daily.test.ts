/**
 * daily.ts テスト
 */

import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
    addMemo,
    addTask,
    completeTask,
    dailyFileExists,
    ensureDailyFile,
    formatTask,
    generateDailyTemplate,
    parseTasks,
    readDailyFile,
} from "../../lib/daily";

describe("daily", () => {
    let testDir: string;
    let projectRoot: string;

    beforeEach(() => {
        testDir = join(tmpdir(), `hibi-test-${Date.now()}`);
        projectRoot = testDir;
        mkdirSync(join(testDir, "projects", "default", "daily"), { recursive: true });
        writeFileSync(join(testDir, "hibi.yaml"), "remote: origin\n");
    });

    afterEach(() => {
        rmSync(testDir, { recursive: true, force: true });
    });

    // ========================================
    // generateDailyTemplate
    // ========================================
    describe("generateDailyTemplate", () => {
        it("正常: SPEC準拠のセクションを含む", () => {
            const template = generateDailyTemplate("20251211");
            expect(template).toContain("# 2025-12-11");
            expect(template).toContain("## Todo");
            expect(template).toContain("## Memo");
            expect(template).toContain("## Summary by LLM");
            expect(template).toContain("## Log By LLM");
        });

        it("正常: 日付がYYYY-MM-DD形式でタイトルに", () => {
            const template = generateDailyTemplate("20240101");
            expect(template).toContain("# 2024-01-01");
        });
    });

    // ========================================
    // ensureDailyFile
    // ========================================
    describe("ensureDailyFile", () => {
        it("正常: ファイルがなければテンプレートで作成", () => {
            const filePath = ensureDailyFile(projectRoot, "default", "20251211");
            expect(existsSync(filePath)).toBe(true);
            const content = readFileSync(filePath, "utf-8");
            expect(content).toContain("## Todo");
        });

        it("正常: 親ディレクトリも作成", () => {
            const newProjectDir = join(testDir, "projects", "newproject", "daily");
            expect(existsSync(newProjectDir)).toBe(false);

            ensureDailyFile(projectRoot, "newproject", "20251211");
            expect(existsSync(newProjectDir)).toBe(true);
        });

        it("エッジ: 既存ファイルは上書きしない", () => {
            const filePath = ensureDailyFile(projectRoot, "default", "20251211");
            writeFileSync(filePath, "# カスタム内容\n");

            ensureDailyFile(projectRoot, "default", "20251211");
            const content = readFileSync(filePath, "utf-8");
            expect(content).toBe("# カスタム内容\n");
        });
    });

    // ========================================
    // dailyFileExists
    // ========================================
    describe("dailyFileExists", () => {
        it("正常: ファイルがあればtrue", () => {
            ensureDailyFile(projectRoot, "default", "20251211");
            expect(dailyFileExists(projectRoot, "default", "20251211")).toBe(true);
        });

        it("正常: ファイルがなければfalse", () => {
            expect(dailyFileExists(projectRoot, "default", "20251211")).toBe(false);
        });
    });

    // ========================================
    // parseTasks
    // ========================================
    describe("parseTasks", () => {
        it("正常: Todoセクションからタスク一覧をパース", () => {
            const content = `# 2025-12-11

## Todo

- [ ] タスク1
- [x] タスク2

## Memo
`;
            const tasks = parseTasks(content);
            expect(tasks).toHaveLength(2);
            expect(tasks[0]).toEqual({ id: 1, text: "タスク1", status: "todo", indent: 0 });
            expect(tasks[1]).toEqual({ id: 2, text: "タスク2", status: "done", indent: 0 });
        });

        it("正常: インデント（子タスク）を正しく認識", () => {
            const content = `## Todo

- [ ] 親タスク
  - [ ] 子タスク1
  - [x] 子タスク2

## Memo
`;
            const tasks = parseTasks(content);
            expect(tasks).toHaveLength(3);
            expect(tasks[0]?.indent).toBe(0);
            expect(tasks[1]?.indent).toBe(1);
            expect(tasks[2]?.indent).toBe(1);
        });

        it("正常: [x] = done, [ ] = todo", () => {
            const content = `## Todo
- [ ] 未完了
- [x] 完了
`;
            const tasks = parseTasks(content);
            expect(tasks[0]?.status).toBe("todo");
            expect(tasks[1]?.status).toBe("done");
        });

        it("エッジ: Todoセクションがない → 空配列", () => {
            const content = `# 2025-12-11
## Memo
- メモ
`;
            const tasks = parseTasks(content);
            expect(tasks).toEqual([]);
        });

        it("エッジ: タスクがない → 空配列", () => {
            const content = `## Todo

## Memo
`;
            const tasks = parseTasks(content);
            expect(tasks).toEqual([]);
        });

        it("エッジ: 不正なチェックボックス形式は無視", () => {
            const content = `## Todo
- [] 不正形式
- 普通のリスト
- [ ] 正しい形式
`;
            const tasks = parseTasks(content);
            expect(tasks).toHaveLength(1);
            expect(tasks[0]?.text).toBe("正しい形式");
        });
    });

    // ========================================
    // formatTask
    // ========================================
    describe("formatTask", () => {
        it("正常: 未完了タスクをフォーマット", () => {
            const result = formatTask({ text: "タスク", status: "todo", indent: 0 });
            expect(result).toBe("- [ ] タスク");
        });

        it("正常: 完了タスクをフォーマット", () => {
            const result = formatTask({ text: "タスク", status: "done", indent: 0 });
            expect(result).toBe("- [x] タスク");
        });

        it("正常: インデントを適用", () => {
            const result = formatTask({ text: "子タスク", status: "todo", indent: 1 });
            expect(result).toBe("  - [ ] 子タスク");
        });
    });

    // ========================================
    // addTask
    // ========================================
    describe("addTask", () => {
        it("正常: Todoセクションの末尾にタスク追加", () => {
            ensureDailyFile(projectRoot, "default", "20251211");
            addTask(projectRoot, "新しいタスク", "default", "20251211");

            const content = readDailyFile(projectRoot, "default", "20251211");
            expect(content).toContain("- [ ] 新しいタスク");
        });

        it("エッジ: 既存タスクがない場合も正しく追加", () => {
            ensureDailyFile(projectRoot, "default", "20251211");
            addTask(projectRoot, "最初のタスク", "default", "20251211");

            const tasks = parseTasks(readDailyFile(projectRoot, "default", "20251211"));
            expect(tasks).toHaveLength(1);
        });

        it("エッジ: 特殊文字を含むタスク", () => {
            ensureDailyFile(projectRoot, "default", "20251211");
            addTask(projectRoot, "タスク `code` と *bold*", "default", "20251211");

            const content = readDailyFile(projectRoot, "default", "20251211");
            expect(content).toContain("- [ ] タスク `code` と *bold*");
        });
    });

    // ========================================
    // completeTask
    // ========================================
    describe("completeTask", () => {
        beforeEach(() => {
            ensureDailyFile(projectRoot, "default", "20251211");
            addTask(projectRoot, "タスクA", "default", "20251211");
            addTask(projectRoot, "タスクB", "default", "20251211");
        });

        it("正常: 部分一致でタスクを完了", () => {
            const result = completeTask(projectRoot, "タスクA", "default", "20251211");
            expect(result).toBe(true);

            const content = readDailyFile(projectRoot, "default", "20251211");
            expect(content).toContain("- [x] タスクA");
        });

        it("エッジ: 存在しないタスク → false", () => {
            const result = completeTask(projectRoot, "存在しない", "default", "20251211");
            expect(result).toBe(false);
        });

        it("エッジ: 既に完了済みのタスクはマッチしない", () => {
            completeTask(projectRoot, "タスクA", "default", "20251211");
            // 再度完了しようとしても既に[x]なのでマッチしない
            const result = completeTask(projectRoot, "タスクA", "default", "20251211");
            expect(result).toBe(false);
        });

        it("エッジ: 複数マッチする場合は最初の1つのみ", () => {
            addTask(projectRoot, "タスク共通", "default", "20251211");
            addTask(projectRoot, "タスク共通2", "default", "20251211");

            completeTask(projectRoot, "タスク共通", "default", "20251211");
            const tasks = parseTasks(readDailyFile(projectRoot, "default", "20251211"));
            const doneTasks = tasks.filter((t) => t.status === "done");
            expect(doneTasks.length).toBe(1);
        });
    });

    // ========================================
    // addMemo
    // ========================================
    describe("addMemo", () => {
        it("正常: Memoセクションにリスト形式で追加", () => {
            ensureDailyFile(projectRoot, "default", "20251211");
            addMemo(projectRoot, "テストメモ", "default", "20251211");

            const content = readDailyFile(projectRoot, "default", "20251211");
            expect(content).toContain("- テストメモ");
        });

        it("正常: 複数メモを追加", () => {
            ensureDailyFile(projectRoot, "default", "20251211");
            addMemo(projectRoot, "メモ1", "default", "20251211");
            addMemo(projectRoot, "メモ2", "default", "20251211");

            const content = readDailyFile(projectRoot, "default", "20251211");
            expect(content).toContain("- メモ1");
            expect(content).toContain("- メモ2");
        });
    });
});
