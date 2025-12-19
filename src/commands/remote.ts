/**
 * Hibi CLI - remote コマンド
 * リモートリポジトリの管理
 */

import { Command } from "commander";
import { loadConfig, requireProjectRoot } from "../lib/config";
import { getRemotes, gitRemoteAdd } from "../lib/git";

/**
 * remoteコマンドを作成
 */
export function createRemoteCommand(): Command {
    const command = new Command("remote")
        .description("リモートリポジトリの管理")
        .action(async () => {
            await listRemotes();
        });

    command
        .command("add")
        .description("リモートリポジトリを追加")
        .argument("<name>", "リモート名 (例: origin)")
        .argument("<url>", "リポジトリのURL")
        .action(async (name: string, url: string) => {
            await addRemote(name, url);
        });

    return command;
}

/**
 * リモート一覧を表示
 */
async function listRemotes(): Promise<void> {
    const projectRoot = requireProjectRoot();
    const result = await getRemotes(projectRoot);

    if (result.success) {
        console.log(result.output);
    } else {
        console.error(`エラー: リモート一覧の取得に失敗しました: ${result.error}`);
    }
}

/**
 * リモートを追加
 */
async function addRemote(name: string, url: string): Promise<void> {
    const projectRoot = requireProjectRoot();
    const result = await gitRemoteAdd(projectRoot, name, url);

    if (result.success) {
        console.log(`✓ リモートを追加しました: ${name} -> ${url}`);
    } else {
        console.error(`エラー: リモートの追加に失敗しました: ${result.error}`);
    }
}
