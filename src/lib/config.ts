/**
 * Hibi CLI - 設定ファイル管理
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse, stringify } from "yaml";
import type { GlobalConfig, HibiConfig, ProjectConfig } from "../types";
import { findProjectRoot, getGlobalConfigDir, getGlobalConfigPath } from "./utils";

/**
 * デフォルトのグローバル設定
 */
const DEFAULT_GLOBAL_CONFIG: GlobalConfig = {
    llm: {
        provider: "none",
    },
    editor: process.env.EDITOR || "vi",
    defaultProject: "default",
};

/**
 * デフォルトのプロジェクト設定
 */
const DEFAULT_PROJECT_CONFIG: ProjectConfig = {
    remote: "origin",
    sync: "manual",
};

/**
 * グローバル設定を読み込む
 */
export function loadGlobalConfig(): GlobalConfig {
    const configPath = getGlobalConfigPath();

    if (!existsSync(configPath)) {
        return DEFAULT_GLOBAL_CONFIG;
    }

    try {
        const content = readFileSync(configPath, "utf-8");
        const config = parse(content) as GlobalConfig;
        return { ...DEFAULT_GLOBAL_CONFIG, ...config };
    } catch (_error) {
        console.error(`警告: グローバル設定の読み込みに失敗しました: ${configPath}`);
        return DEFAULT_GLOBAL_CONFIG;
    }
}

/**
 * プロジェクト設定を読み込む
 */
export function loadProjectConfig(projectRoot: string): ProjectConfig {
    const configPath = join(projectRoot, "hibi.yaml");

    if (!existsSync(configPath)) {
        return DEFAULT_PROJECT_CONFIG;
    }

    try {
        const content = readFileSync(configPath, "utf-8");
        const config = parse(content) as ProjectConfig;
        return { ...DEFAULT_PROJECT_CONFIG, ...config };
    } catch (_error) {
        console.error(`警告: プロジェクト設定の読み込みに失敗しました: ${configPath}`);
        return DEFAULT_PROJECT_CONFIG;
    }
}

/**
 * グローバル設定とプロジェクト設定をマージして読み込む
 * SPEC: プロジェクト設定がグローバル設定を上書き（shallow merge）
 */
export function loadConfig(): HibiConfig {
    const globalConfig = loadGlobalConfig();
    const projectRoot = findProjectRoot();

    if (!projectRoot) {
        return {
            ...globalConfig,
            ...DEFAULT_PROJECT_CONFIG,
        };
    }

    const projectConfig = loadProjectConfig(projectRoot);

    // Shallow merge: プロジェクト設定の第一階層がグローバル設定を上書き
    return {
        ...globalConfig,
        ...projectConfig,
        projectRoot,
        currentProject: globalConfig.defaultProject || "default",
    };
}

/**
 * グローバル設定を保存
 */
export function saveGlobalConfig(config: GlobalConfig): void {
    const configDir = getGlobalConfigDir();
    const configPath = getGlobalConfigPath();

    if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true });
    }

    const content = stringify(config);
    writeFileSync(configPath, content, "utf-8");
}

/**
 * プロジェクト設定を保存
 */
export function saveProjectConfig(projectRoot: string, config: ProjectConfig): void {
    const configPath = join(projectRoot, "hibi.yaml");
    const content = stringify(config);
    writeFileSync(configPath, content, "utf-8");
}

/**
 * プロジェクトルートが存在するか確認し、なければエラー
 */
export function requireProjectRoot(): string {
    const projectRoot = findProjectRoot();
    if (!projectRoot) {
        console.error("エラー: hibiプロジェクトが見つかりません。");
        console.error("'hibi init' でプロジェクトを初期化してください。");
        process.exit(1);
    }
    return projectRoot;
}
