/**
 * config.ts テスト
 */

import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadConfig, loadProjectConfig, saveProjectConfig } from "../../lib/config";

describe("config", () => {
    let testDir: string;
    let originalCwd: string;

    beforeEach(() => {
        testDir = join(tmpdir(), `hibi-test-${Date.now()}`);
        mkdirSync(testDir, { recursive: true });
        originalCwd = process.cwd();
        process.chdir(testDir);
    });

    afterEach(() => {
        process.chdir(originalCwd);
        rmSync(testDir, { recursive: true, force: true });
    });

    // ========================================
    // loadProjectConfig
    // ========================================
    describe("loadProjectConfig", () => {
        it("正常: YAMLを正しくパース", () => {
            writeFileSync(join(testDir, "hibi.yaml"), "remote: upstream\nsync: daily\n");
            const config = loadProjectConfig(testDir);
            expect(config.remote).toBe("upstream");
            expect(config.sync).toBe("daily");
        });

        it("エッジ: ファイルがない → デフォルト値", () => {
            const config = loadProjectConfig(testDir);
            expect(config.remote).toBe("origin");
            expect(config.sync).toBe("manual");
        });

        it("エッジ: 空ファイル → デフォルト値", () => {
            writeFileSync(join(testDir, "hibi.yaml"), "");
            const config = loadProjectConfig(testDir);
            expect(config.remote).toBe("origin");
            expect(config.sync).toBe("manual");
        });
    });

    // ========================================
    // saveProjectConfig
    // ========================================
    describe("saveProjectConfig", () => {
        it("正常: YAMLファイルに書き込み", () => {
            saveProjectConfig(testDir, { remote: "test-origin", sync: "auto" });
            expect(existsSync(join(testDir, "hibi.yaml"))).toBe(true);
            const content = readFileSync(join(testDir, "hibi.yaml"), "utf-8");
            expect(content).toContain("remote: test-origin");
            expect(content).toContain("sync: auto");
        });

        it("エッジ: 既存ファイルを上書き", () => {
            writeFileSync(join(testDir, "hibi.yaml"), "remote: old\n");
            saveProjectConfig(testDir, { remote: "new" });
            const content = readFileSync(join(testDir, "hibi.yaml"), "utf-8");
            expect(content).toContain("remote: new");
            expect(content).not.toContain("old");
        });
    });

    // ========================================
    // loadConfig (統合)
    // ========================================
    describe("loadConfig", () => {
        it("エッジ: プロジェクトルートがない → グローバルのみのデフォルト", () => {
            // hibi.yamlがないディレクトリ
            const config = loadConfig();
            expect(config.remote).toBe("origin");
            expect(config.sync).toBe("manual");
        });

        it("正常: プロジェクト設定を読み込み", () => {
            writeFileSync(join(testDir, "hibi.yaml"), "remote: project-remote\n");
            const config = loadConfig();
            expect(config.remote).toBe("project-remote");
            expect(config.projectRoot).toBe(testDir);
        });
    });
});
