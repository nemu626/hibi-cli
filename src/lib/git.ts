/**
 * Hibi CLI - Git操作
 */

import { spawn } from "node:child_process";

export interface GitResult {
    success: boolean;
    output: string;
    error?: string;
}

/**
 * Gitコマンドを実行（引数を配列で渡してコマンドインジェクションを防止）
 */
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

/**
 * Git repoを初期化
 */
export async function gitInit(cwd: string): Promise<GitResult> {
    return runGitCommand(["init"], cwd);
}

/**
 * Gitリポジトリかどうか確認
 */
export async function isGitRepo(cwd: string): Promise<boolean> {
    const result = await runGitCommand(["rev-parse", "--git-dir"], cwd);
    return result.success;
}

/**
 * Git pull
 */
export async function gitPull(cwd: string, remote: string = "origin"): Promise<GitResult> {
    return runGitCommand(["pull", remote], cwd);
}

/**
 * Git push
 */
export async function gitPush(cwd: string, remote: string = "origin"): Promise<GitResult> {
    return runGitCommand(["push", remote], cwd);
}

/**
 * Git add all
 */
export async function gitAddAll(cwd: string): Promise<GitResult> {
    return runGitCommand(["add", "-A"], cwd);
}

/**
 * Git commit
 */
export async function gitCommit(cwd: string, message: string): Promise<GitResult> {
    return runGitCommand(["commit", "-m", message], cwd);
}

/**
 * Git clone
 */
export async function gitClone(repoUrl: string, targetDir: string): Promise<GitResult> {
    return runGitCommand(["clone", repoUrl, targetDir], process.cwd());
}

/**
 * Gitのコミットログを取得
 */
export async function getGitLog(
    cwd: string,
    since?: string,
    limit: number = 50,
): Promise<GitResult> {
    const args = ["log", "--oneline", "-n", String(limit)];
    if (since) {
        args.push(`--since=${since}`);
    }
    return runGitCommand(args, cwd);
}

/**
 * 変更があるか確認
 */
export async function hasChanges(cwd: string): Promise<boolean> {
    const result = await runGitCommand(["status", "--porcelain"], cwd);
    return result.success && result.output.length > 0;
}

/**
 * 変更をステージング、コミット
 */
export async function commitChanges(cwd: string, message: string): Promise<GitResult> {
    const addResult = await gitAddAll(cwd);
    if (!addResult.success) {
        return addResult;
    }

    return gitCommit(cwd, message);
}

/**
 * リモートが設定されているか確認
 */
export async function hasRemote(cwd: string, remote: string = "origin"): Promise<boolean> {
    const result = await runGitCommand(["remote", "get-url", remote], cwd);
    return result.success;
}
