/**
 * utils.ts テスト
 */

import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
    findProjectRoot,
    formatDateString,
    getAssetsDir,
    getDailyDir,
    getDailyFilePath,
    getTodayString,
} from "../../lib/utils";

describe("utils", () => {
    // ========================================
    // getTodayString
    // ========================================
    describe("getTodayString", () => {
        it("正常: 今日の日付がYYYYMMDD形式で返される", () => {
            const result = getTodayString();
            expect(result).toMatch(/^\d{8}$/);

            const now = new Date();
            const expected = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
            expect(result).toBe(expected);
        });

        it("エッジ: 月・日が1桁の場合も0埋めされる", () => {
            const result = getTodayString();
            // 形式が8桁であることを確認（0埋めされている）
            expect(result.length).toBe(8);
        });
    });

    // ========================================
    // formatDateString
    // ========================================
    describe("formatDateString", () => {
        it("正常: YYYYMMDD → YYYY-MM-DD変換", () => {
            expect(formatDateString("20251211")).toBe("2025-12-11");
            expect(formatDateString("20240101")).toBe("2024-01-01");
        });

        it("エッジ: 8桁未満はそのまま返す", () => {
            expect(formatDateString("2025")).toBe("2025");
            expect(formatDateString("202512")).toBe("202512");
        });

        it("エッジ: 8桁超過はそのまま返す", () => {
            expect(formatDateString("202512111")).toBe("202512111");
        });

        it("エッジ: 空文字はそのまま返す", () => {
            expect(formatDateString("")).toBe("");
        });
    });

    // ========================================
    // findProjectRoot
    // ========================================
    describe("findProjectRoot", () => {
        let testDir: string;

        beforeEach(() => {
            testDir = join(tmpdir(), `hibi-test-${Date.now()}`);
            mkdirSync(testDir, { recursive: true });
        });

        afterEach(() => {
            rmSync(testDir, { recursive: true, force: true });
        });

        it("正常: カレントにhibi.yamlがあれば検出", () => {
            writeFileSync(join(testDir, "hibi.yaml"), "remote: origin\n");
            const result = findProjectRoot(testDir);
            expect(result).toBe(testDir);
        });

        it("正常: 親ディレクトリを遡って検出", () => {
            const subDir = join(testDir, "subdir", "nested");
            mkdirSync(subDir, { recursive: true });
            writeFileSync(join(testDir, "hibi.yaml"), "remote: origin\n");

            const result = findProjectRoot(subDir);
            expect(result).toBe(testDir);
        });

        it("エッジ: ルートまで見つからなければnull", () => {
            const result = findProjectRoot(testDir);
            expect(result).toBeNull();
        });
    });

    // ========================================
    // getDailyFilePath / getDailyDir / getAssetsDir
    // ========================================
    describe("getDailyFilePath", () => {
        it("正常: 正しいパス projects/{name}/daily/{date}.md", () => {
            const result = getDailyFilePath("/root", "default", "20251211");
            expect(result).toBe("/root/projects/default/daily/20251211.md");
        });

        it("エッジ: プロジェクト名にハイフン・アンダースコア含む", () => {
            const result = getDailyFilePath("/root", "my-project_1", "20251211");
            expect(result).toBe("/root/projects/my-project_1/daily/20251211.md");
        });
    });

    describe("getDailyDir", () => {
        it("正常: 日報ディレクトリのパスを返す", () => {
            expect(getDailyDir("/root", "default")).toBe("/root/projects/default/daily");
        });
    });

    describe("getAssetsDir", () => {
        it("正常: assetsディレクトリのパスを返す", () => {
            expect(getAssetsDir("/root", "default")).toBe("/root/projects/default/assets");
        });
    });
});
