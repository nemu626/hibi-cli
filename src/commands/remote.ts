/**
 * Hibi CLI - remote コマンド
 * Gitリモート管理
 */

import { spawn } from "node:child_process";
import { Command } from "commander";
import { requireProjectRoot } from "../lib/config";

/**
 * remoteコマンドを作成
 */
export function createRemoteCommand(): Command {
    const command = new Command("remote").description("Gitリモート管理");

    // サブコマンド: add
    command
        .command("add <name> <url>")
        .description("リモートリポジトリを追加")
        .action(async (name: string, url: string) => {
            await addRemote(name, url);
        });

    // サブコマンド: list
    command
        .command("list")
        .alias("ls")
        .description("リモートリポジトリ一覧を表示")
        .action(async () => {
            await listRemotes();
        });

    return command;
}

/**
 * リモートリポジトリを追加
 */
async function addRemote(name: string, url: string): Promise<void> {
    const projectRoot = requireProjectRoot();

    console.log(`リモート '${name}' を追加中...`);

    const result = await runGitCommand(["remote", "add", name, url], projectRoot);

    if (result.success) {
        console.log(`✓ リモートを追加しました: ${name} -> ${url}`);
    } else {
        console.error(`エラー: リモートの追加に失敗しました: ${result.error}`);
        process.exit(1);
    }
}

/**
 * リモートリポジトリ一覧を表示
 */
async function listRemotes(): Promise<void> {
    const projectRoot = requireProjectRoot();

    const result = await runGitCommand(["remote", "-v"], projectRoot);

    if (result.success) {
        if (result.output) {
            console.log(result.output);
        } else {
            console.log("リモートリポジトリは設定されていません");
        }
    } else {
        console.error(`エラー: リモート一覧の取得に失敗しました: ${result.error}`);
        process.exit(1);
    }
}

interface GitResult {
    success: boolean;
    output: string;
    error?: string;
}

async function runGitCommand(args: string[], cwd: string): Promise<GitResult> {
    return new Promise((resolve) => {
        const gitProcess = spawn("git", args, { cwd });
        let stdout = "";
        let stderr = "";

        gitProcess.stdout.on("data", (data) => {
            stdout += data.toString();
        });

        gitProcess.stderr.on("data", (data) => {
            stderr += data.toString();
        });

        gitProcess.on("close", (code) => {
            if (code === 0) {
                resolve({
                    success: true,
                    output: stdout.trim(),
                    error: stderr.trim() || undefined,
                });
            } else {
                resolve({
                    success: false,
                    output: stdout.trim(),
                    error: stderr.trim() || `Exit code: ${code}`,
                });
            }
        });

        gitProcess.on("error", (err) => {
            resolve({
                success: false,
                output: "",
                error: err.message,
            });
        });
    });
}
