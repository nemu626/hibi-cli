/**
 * Hibi CLI - remote コマンド
 * Gitリモートを管理
 */

import { Command } from "commander";
import { requireProjectRoot } from "../lib/config";
import { gitRemoteAdd, hasRemote } from "../lib/git";

/**
 * remoteコマンドを作成
 */
export function createRemoteCommand(): Command {
    const command = new Command("remote")
        .description("Gitリモートを管理")
        .argument("add <url>", "リモートリポジトリのURL")
        .option("-n, --name <name>", "リモート名", "origin")
        .action(async (url: string, options: { name: string }) => {
            await handleRemoteAdd(url, options.name);
        });

    return command;
}

/**
 * リモートを追加
 */
async function handleRemoteAdd(url: string, remoteName: string): Promise<void> {
    const projectRoot = requireProjectRoot();

    // 既にリモートが存在するか確認
    const exists = await hasRemote(projectRoot, remoteName);
    if (exists) {
        console.error(`エラー: リモート '${remoteName}' は既に存在します`);
        process.exit(1);
    }

    // リモートを追加
    const result = await gitRemoteAdd(projectRoot, url, remoteName);

    if (result.success) {
        console.log(`✓ リモート '${remoteName}' を追加しました: ${url}`);
    } else {
        console.error(`エラー: リモートの追加に失敗しました: ${result.error}`);
        process.exit(1);
    }
}
