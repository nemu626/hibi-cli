/**
 * Hibi CLI - sync コマンド
 * Gitの同期を行う
 */

import { Command } from "commander";
import { loadConfig, requireProjectRoot } from "../lib/config";
import { commitChanges, gitPull, gitPush, hasChanges, hasRemote, isGitRepo } from "../lib/git";
import { formatDateString, getTodayString } from "../lib/utils";

/**
 * syncコマンドを作成
 */
export function createSyncCommand(): Command {
    const command = new Command("sync")
        .description("Gitリポジトリを同期")
        .option("--push", "pushのみ実行")
        .option("--pull", "pullのみ実行")
        .action(async (options: { push?: boolean; pull?: boolean }) => {
            await syncRepo(options);
        });

    return command;
}

/**
 * リポジトリを同期
 */
async function syncRepo(options: { push?: boolean; pull?: boolean }): Promise<void> {
    const projectRoot = requireProjectRoot();
    const config = loadConfig();
    const remote = config.remote || "origin";

    // Gitリポジトリか確認
    const isRepo = await isGitRepo(projectRoot);
    if (!isRepo) {
        console.error("エラー: このディレクトリはGitリポジトリではありません");
        process.exit(1);
    }

    // リモートが設定されているか確認
    const remoteExists = await hasRemote(projectRoot, remote);

    // --pull のみ
    if (options.pull && !options.push) {
        if (!remoteExists) {
            console.error(`エラー: リモート '${remote}' が設定されていません`);
            console.log("ヒント: リモートリポジトリを設定してください:");
            console.log(`   git remote add ${remote} <url>`);
            process.exit(1);
        }
        console.log("リモートから変更を取得中...");
        const result = await gitPull(projectRoot, remote);
        if (result.success) {
            console.log("✓ Pull完了");
            if (result.output) {
                console.log(result.output);
            }
        } else {
            console.error(`エラー: Pullに失敗しました: ${result.error}`);
            process.exit(1);
        }
        return;
    }

    // --push のみ
    if (options.push && !options.pull) {
        if (!remoteExists) {
            console.error(`エラー: リモート '${remote}' が設定されていません`);
            console.log("ヒント: リモートリポジトリを設定してください:");
            console.log(`   git remote add ${remote} <url>`);
            process.exit(1);
        }
        await pushChanges(projectRoot, remote);
        return;
    }

    // 両方（デフォルト動作）
    console.log("同期を開始します...\n");

    // リモートが設定されていない場合
    if (!remoteExists) {
        console.log("⚠ リモートリポジトリが設定されていません");
        console.log("ヒント: リモートリポジトリを設定してください:");
        console.log(`   git remote add ${remote} <url>`);
        console.log("\nローカルの変更のみコミットします...\n");

        // 変更があればコミットのみ
        const changes = await hasChanges(projectRoot);
        if (changes) {
            const dateStr = formatDateString(getTodayString());
            const commitResult = await commitChanges(projectRoot, `hibi: ${dateStr} 更新`);
            if (commitResult.success) {
                console.log("✓ コミット完了");
            } else if (!commitResult.error?.includes("nothing to commit")) {
                console.error(`エラー: コミット失敗 (${commitResult.error})`);
            }
        } else {
            console.log("変更なし");
        }
        return;
    }

    // まずpull
    console.log("1. リモートから変更を取得中...");
    const pullResult = await gitPull(projectRoot, remote);
    if (pullResult.success) {
        console.log("   ✓ Pull完了");
    } else {
        // コンフリクトの可能性
        if (pullResult.error?.includes("conflict")) {
            console.error("   ⚠ コンフリクトが発生しました");
            console.error("   手動で解決してください:");
            console.error(`   cd ${projectRoot}`);
            console.error("   git status");
            process.exit(1);
        }
        // リモートがない場合は警告のみ
        console.warn(`   警告: Pull失敗 (${pullResult.error})`);
    }

    // 変更をpush
    console.log("\n2. ローカルの変更をプッシュ中...");
    await pushChanges(projectRoot, remote);

    console.log("\n🎉 同期完了！");
}

/**
 * 変更をプッシュ
 */
async function pushChanges(projectRoot: string, remote: string): Promise<void> {
    // 変更があるか確認
    const changes = await hasChanges(projectRoot);
    if (changes) {
        // 日付付きでコミット
        const dateStr = formatDateString(getTodayString());
        const commitResult = await commitChanges(projectRoot, `hibi: ${dateStr} 更新`);

        if (commitResult.success) {
            console.log("   ✓ コミット完了");
        } else if (!commitResult.error?.includes("nothing to commit")) {
            console.error(`   エラー: コミット失敗 (${commitResult.error})`);
        }
    } else {
        console.log("   変更なし");
    }

    // push
    const pushResult = await gitPush(projectRoot, remote);
    if (pushResult.success) {
        console.log("   ✓ Push完了");
    } else {
        // リモートがない場合は警告のみ
        console.warn(`   警告: Push失敗 (${pushResult.error})`);
        console.log("   ヒント: リモートリポジトリを設定してください:");
        console.log(`   git remote add origin <url>`);
    }
}
