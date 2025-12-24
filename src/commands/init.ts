/**
 * Hibi CLI - init コマンド
 * プロジェクトの初期化を行う
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { Command } from "commander";
import { saveProjectConfig } from "../lib/config";
import { addRemote, gitClone, gitInit, isGitRepo } from "../lib/git";
import type { ProjectConfig } from "../types";

/**
 * initコマンドを作成
 */
export function createInitCommand(): Command {
    const command = new Command("init")
        .description("新しいhibiプロジェクトを初期化する")
        .argument(
            "[directory]",
            "プロジェクトディレクトリ（デフォルト: カレントディレクトリ）",
            ".",
        )
        .option("--clone <url>", "既存のGitリポジトリをクローンして初期化")
        .option("--no-git", "Gitリポジトリを初期化しない")
        .option("--add-remote <url>", "リモートリポジトリを追加 (origin)")
        .action(async (directory: string, options: { clone?: string; git: boolean; addRemote?: string }) => {
            await initProject(directory, options);
        });

    return command;
}

/**
 * URLからリポジトリ名を抽出
 */
function getRepoNameFromUrl(url: string): string {
    // https://github.com/user/repo.git → repo
    // https://github.com/user/repo → repo
    // git@github.com:user/repo.git → repo
    const match = url.match(/\/([^/]+?)(\.git)?$/) || url.match(/:([^/]+?)(\.git)?$/);
    return match?.[1] ?? "hibi-project";
}

/**
 * プロジェクトを初期化
 */
async function initProject(
    directory: string,
    options: { clone?: string; git: boolean; addRemote?: string },
): Promise<void> {
    // --no-git と --add-remote の組み合わせはエラー
    if (!options.git && options.addRemote) {
        console.error("エラー: --no-git と --add-remote は同時に使用できません");
        process.exit(1);
    }

    // クローンの場合、directoryがデフォルト(".")ならURLからリポジトリ名を抽出
    let targetDir: string;
    if (options.clone && directory === ".") {
        const repoName = getRepoNameFromUrl(options.clone);
        targetDir = resolve(repoName);
    } else {
        targetDir = resolve(directory);
    }

    // クローンの場合
    if (options.clone) {
        console.log(`リポジトリをクローン中: ${options.clone}`);
        const cloneResult = await gitClone(options.clone, targetDir);

        if (!cloneResult.success) {
            console.error(`エラー: クローンに失敗しました: ${cloneResult.error}`);
            process.exit(1);
        }

        console.log(`✓ クローン完了: ${targetDir}`);

        // hibi.yamlが存在するか確認
        const configPath = join(targetDir, "hibi.yaml");
        if (existsSync(configPath)) {
            console.log("✓ 既存のhibiプロジェクトを検出しました");
            return;
        }
    }

    // ディレクトリが存在しない場合は作成
    if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true });
        console.log(`✓ ディレクトリを作成: ${targetDir}`);
    }

    // 既にhibiプロジェクトが存在する場合
    const configPath = join(targetDir, "hibi.yaml");
    if (existsSync(configPath)) {
        console.error("エラー: このディレクトリは既にhibiプロジェクトとして初期化されています");
        process.exit(1);
    }

    // Gitリポジトリの初期化
    if (options.git && !options.clone) {
        const isRepo = await isGitRepo(targetDir);
        if (!isRepo) {
            console.log("Gitリポジトリを初期化中...");
            const initResult = await gitInit(targetDir);
            if (initResult.success) {
                console.log("✓ Gitリポジトリを初期化しました");
            } else {
                console.warn(`警告: Gitの初期化に失敗しました: ${initResult.error}`);
            }
        }

        // リモートを追加（--add-remote オプション）
        if (options.addRemote) {
            console.log(`リモートを追加中: ${options.addRemote}`);
            const remoteResult = await addRemote(targetDir, "origin", options.addRemote);
            if (remoteResult.success) {
                console.log("✓ リモートを追加しました (origin)");
            } else {
                console.warn(`警告: リモートの追加に失敗しました: ${remoteResult.error}`);
            }
        }
    }

    // ディレクトリ構造を作成
    const projectsDir = join(targetDir, "projects");
    const defaultProjectDir = join(projectsDir, "default");
    const dailyDir = join(defaultProjectDir, "daily");
    const assetsDir = join(defaultProjectDir, "assets");

    mkdirSync(dailyDir, { recursive: true });
    mkdirSync(assetsDir, { recursive: true });
    console.log("✓ ディレクトリ構造を作成しました");

    // 設定ファイルを作成
    const defaultConfig: ProjectConfig = {
        remote: "origin",
        sync: "manual",
    };

    saveProjectConfig(targetDir, defaultConfig);
    console.log("✓ hibi.yaml を作成しました");

    // .gitignoreを作成（存在しない場合）
    const gitignorePath = join(targetDir, ".gitignore");
    if (!existsSync(gitignorePath)) {
        const gitignoreContent = `# OS
.DS_Store
Thumbs.db

# Editor
*.swp
*.swo
*~

# Local config (API keys など)
.env.local
`;
        writeFileSync(gitignorePath, gitignoreContent, "utf-8");
        console.log("✓ .gitignore を作成しました");
    }

    console.log("");
    console.log("🎉 hibiプロジェクトの初期化が完了しました！");
    console.log("");
    console.log("次のステップ:");
    console.log("  hibi todo <タスク>   - タスクを追加");
    console.log("  hibi list            - タスク一覧を表示");
    console.log("  hibi done <タスク>   - タスクを完了");
}
