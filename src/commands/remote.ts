/**
 * Hibi CLI - remote コマンド
 * リモートリポジトリの管理
 */

import { Command } from "commander";
import { loadConfig, requireProjectRoot } from "../lib/config";
import { addRemote, hasRemote, isGitRepo } from "../lib/git";

/**
 * remoteコマンドを作成
 */
export function createRemoteCommand(): Command {
    const command = new Command("remote").description("リモートリポジトリを管理").alias("r");

    // remote add サブコマンド
    command
        .command("add")
        .description("リモートリポジトリを追加")
        .argument("<url>", "リモートリポジトリのURL")
        .argument("[name]", "リモート名（デフォルト: origin）", "origin")
        .action(async (url: string, name: string) => {
            await addRemoteAction(url, name);
        });

    return command;
}

/**
 * リモートを追加
 */
async function addRemoteAction(url: string, name: string): Promise<void> {
    const projectRoot = requireProjectRoot();

    // Gitリポジトリか確認
    const isRepo = await isGitRepo(projectRoot);
    if (!isRepo) {
        console.error("エラー: このディレクトリはGitリポジトリではありません");
        console.error("'hibi init' でプロジェクトを初期化してください");
        process.exit(1);
    }

    // 既にリモートが設定されているか確認
    const remoteExists = await hasRemote(projectRoot, name);
    if (remoteExists) {
        console.error(`エラー: リモート '${name}' は既に設定されています`);
        console.error(
            `ヒント: 既存のリモートを変更する場合は 'git remote set-url ${name} <url>' を使用してください`,
        );
        process.exit(1);
    }

    // リモートを追加
    console.log(`リモートを追加中: ${name} -> ${url}`);
    const result = await addRemote(projectRoot, name, url);

    if (result.success) {
        console.log(`✓ リモート '${name}' を追加しました`);
        console.log("");
        console.log("次のステップ:");
        console.log("  hibi sync             - リモートと同期");
        console.log("  hibi sync --push      - 変更をプッシュ");
    } else {
        console.error(`エラー: リモートの追加に失敗しました: ${result.error}`);
        process.exit(1);
    }
}
