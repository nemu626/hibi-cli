/**
 * Hibi CLI - remote コマンド
 * Gitリモートの管理
 */

import { Command } from "commander";
import { loadConfig, requireProjectRoot } from "../lib/config";
import { gitRemoteAdd, gitRemoteList } from "../lib/git";

/**
 * remoteコマンドを作成
 */
export function createRemoteCommand(): Command {
    const command = new Command("remote")
        .description("Gitリモートの管理")
        .argument("[action]", "アクション (add, list)", "list")
        .argument("[args...]", "アクションの引数")
        .action(async (action: string, args: string[]) => {
            await handleRemote(action, args);
        });

    return command;
}

/**
 * リモート操作を処理
 */
async function handleRemote(action: string, args: string[]): Promise<void> {
    const projectRoot = requireProjectRoot();

    switch (action) {
        case "add": {
            if (args.length < 1) {
                console.error("エラー: リポジトリURLを指定してください");
                console.log("使用法: hibi remote add <url> [name]");
                return;
            }
            const url = args[0];
            const name = args[1] || "origin";

            console.log(`リモートを追加中: ${name} -> ${url}`);
            const result = await gitRemoteAdd(projectRoot, url, name);

            if (result.success) {
                console.log(`✓ リモート '${name}' を追加しました`);
            } else {
                console.error(`エラー: リモートの追加に失敗しました: ${result.error}`);
            }
            break;
        }

        case "list": {
            const result = await gitRemoteList(projectRoot);
            if (result.success) {
                console.log(result.output);
            } else {
                console.error(`エラー: リモート一覧の取得に失敗しました: ${result.error}`);
            }
            break;
        }

        default:
            console.error(`エラー: 不明なアクション '${action}'`);
            console.log("使用法:");
            console.log("  hibi remote add <url> [name]  - リモートを追加");
            console.log("  hibi remote list              - リモート一覧を表示");
            break;
    }
}
