/**
 * Hibi CLI - project コマンド
 * プロジェクト管理
 */

import { existsSync, mkdirSync, readdirSync, renameSync } from "node:fs";
import { join } from "node:path";
import { Command } from "commander";
import { loadConfig, loadGlobalConfig, requireProjectRoot, saveGlobalConfig } from "../lib/config";

/**
 * projectコマンドを作成
 */
export function createProjectCommand(): Command {
    const command = new Command("project").alias("p").description("プロジェクト管理");

    // サブコマンド: list
    command
        .command("list")
        .alias("ls")
        .description("プロジェクト一覧を表示")
        .action(() => {
            listProjects();
        });

    // サブコマンド: switch
    command
        .command("switch <name>")
        .alias("sw")
        .description("プロジェクトを切り替え")
        .action((name: string) => {
            switchProject(name);
        });

    // サブコマンド: create
    command
        .command("create <name>")
        .alias("new")
        .description("新しいプロジェクトを作成")
        .action((name: string) => {
            createProject(name);
        });

    // サブコマンド: rename
    command
        .command("rename <oldName> <newName>")
        .description("プロジェクトの名前を変更")
        .action((oldName: string, newName: string) => {
            renameProject(oldName, newName);
        });

    // サブコマンド: current
    command
        .command("current")
        .description("現在のプロジェクトを表示")
        .action(() => {
            showCurrentProject();
        });

    return command;
}

/**
 * プロジェクト一覧を表示
 */
function listProjects(): void {
    const projectRoot = requireProjectRoot();
    const config = loadConfig();
    const currentProject = config.currentProject || "default";

    const projectsDir = join(projectRoot, "projects");

    if (!existsSync(projectsDir)) {
        console.log("プロジェクトはありません");
        return;
    }

    const projects = readdirSync(projectsDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

    console.log("\n📁 プロジェクト一覧:\n");

    for (const project of projects) {
        const isCurrent = project === currentProject;
        const marker = isCurrent ? "→ " : "  ";
        const style = isCurrent ? "\x1b[32m" : "";
        const reset = isCurrent ? "\x1b[0m" : "";
        console.log(`${marker}${style}${project}${reset}`);
    }

    console.log("");
}

/**
 * プロジェクトを切り替え
 */
function switchProject(name: string): void {
    const projectRoot = requireProjectRoot();
    const projectDir = join(projectRoot, "projects", name);

    if (!existsSync(projectDir)) {
        console.error(`エラー: プロジェクトが見つかりません: ${name}`);
        console.log("利用可能なプロジェクト:");
        listProjects();
        process.exit(1);
    }

    // グローバル設定を更新
    const globalConfig = loadGlobalConfig();
    globalConfig.defaultProject = name;
    saveGlobalConfig(globalConfig);

    console.log(`✓ プロジェクトを切り替えました: ${name}`);
}

/**
 * 新しいプロジェクトを作成
 */
function createProject(name: string): void {
    const projectRoot = requireProjectRoot();
    const projectDir = join(projectRoot, "projects", name);

    if (existsSync(projectDir)) {
        console.error(`エラー: プロジェクトは既に存在します: ${name}`);
        process.exit(1);
    }

    // 名前のバリデーション
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
        console.error("エラー: プロジェクト名には英数字、ハイフン、アンダースコアのみ使用できます");
        process.exit(1);
    }

    // ディレクトリを作成
    const dailyDir = join(projectDir, "daily");
    const assetsDir = join(projectDir, "assets");

    mkdirSync(dailyDir, { recursive: true });
    mkdirSync(assetsDir, { recursive: true });

    console.log(`✓ プロジェクトを作成しました: ${name}`);
    console.log(`  ${projectDir}`);
    console.log("");
    console.log(`'hibi project switch ${name}' で切り替えできます`);
}

/**
 * プロジェクトの名前を変更
 */
function renameProject(oldName: string, newName: string): void {
    const projectRoot = requireProjectRoot();
    const oldDir = join(projectRoot, "projects", oldName);
    const newDir = join(projectRoot, "projects", newName);

    if (!existsSync(oldDir)) {
        console.error(`エラー: プロジェクトが見つかりません: ${oldName}`);
        process.exit(1);
    }

    if (existsSync(newDir)) {
        console.error(`エラー: プロジェクトは既に存在します: ${newName}`);
        process.exit(1);
    }

    if (oldName === "default") {
        console.error("エラー: defaultプロジェクトの名前は変更できません");
        process.exit(1);
    }

    // 名前のバリデーション
    if (!/^[a-zA-Z0-9_-]+$/.test(newName)) {
        console.error("エラー: プロジェクト名には英数字、ハイフン、アンダースコアのみ使用できます");
        process.exit(1);
    }

    renameSync(oldDir, newDir);

    // 現在のプロジェクトが変更対象の場合、設定も更新
    const globalConfig = loadGlobalConfig();
    if (globalConfig.defaultProject === oldName) {
        globalConfig.defaultProject = newName;
        saveGlobalConfig(globalConfig);
    }

    console.log(`✓ プロジェクト名を変更しました: ${oldName} → ${newName}`);
}

/**
 * 現在のプロジェクトを表示
 */
function showCurrentProject(): void {
    const config = loadConfig();
    const currentProject = config.currentProject || "default";
    console.log(`現在のプロジェクト: ${currentProject}`);
}
