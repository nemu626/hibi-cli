
/**
 * Hibi CLI - add-remote コマンド
 * Gitリモートリポジトリを追加する
 */

import { confirm, input } from "@inquirer/prompts";
import { Command } from "commander";
import { gitAddRemote, gitPush, hasRemote, isGitRepo } from "../lib/git";

/**
 * add-remoteコマンドを作成
 */
export function createAddRemoteCommand(): Command {
    const command = new Command("add-remote")
        .description("新しいGitリモートリポジトリを追加する")
        .argument("[repository-url]", "GitリモートリポジトリのURL")
        .action(async (repositoryUrl: string | undefined) => {
            await addRemote(repositoryUrl);
        });

    return command;
}

/**
 * リモートリポジトリを追加
 */
async function addRemote(repositoryUrl: string | undefined): Promise<void> {
    const targetDir = process.cwd();

    // Gitリポジトリかどうか確認
    if (!(await isGitRepo(targetDir))) {
        console.error(
            "エラー: このディレクトリはGitリポジトリではありません。'hibi init' を実行してください。",
        );
        process.exit(1);
    }

    // originリモートが既に存在するか確認
    if (await hasRemote(targetDir, "origin")) {
        console.error(
            "エラー: 'origin' という名前のリモートは既に存在します。",
        );
        process.exit(1);
    }


    let repoUrl = repositoryUrl;
    if (!repoUrl) {
        repoUrl = await input({
            message:
                "空のGitのリモートレポジトリのUrlを指定してください、まだない場合、以下のリンクから作成してください。(githubの場合)\nCreate New Repository on Github: https://github.com/new\n",
        });
    }

    if (!repoUrl) {
        console.log("処理を中断しました。");
        return;
    }

    const confirmed = await confirm({
        message: `hibiが自動的に該当レポジトリにpull, pushを行います。'${repoUrl}'を追加しますか？`,
    });

    if (!confirmed) {
        console.log("処理を中断しました。");
        return;
    }

    console.log("リモートリポジトリを追加中...");
    const addResult = await gitAddRemote(targetDir, "origin", repoUrl);

    if (!addResult.success) {
        console.error(`エラー: リモートリポジトリの追加に失敗しました: ${addResult.error}`);
        process.exit(1);
    }

    console.log("✓ リモートリポジトリ 'origin' を追加しました");

    console.log("リポジトリにpush中...");
    // note: `git push` might require `-u` for the first time.
    // Let's try a simple push first.
    const pushResult = await gitPush(targetDir, "origin");

    if (!pushResult.success) {
        console.error(`エラー: pushに失敗しました: ${pushResult.error}`);
        console.error("ヒント: sshキーが設定されているか、リポジトリへのアクセス権があるか確認してください。");
        console.error("ヒント: また、`git push -u origin <branch-name>` を手動で実行する必要があるかもしれません。");
        process.exit(1);
    }

    console.log("✓ pushに成功しました！");
    console.log("🎉 hibiのリモート設定が完了しました！");
}
