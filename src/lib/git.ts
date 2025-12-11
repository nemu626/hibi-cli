/**
 * Hibi CLI - Git操作
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface GitResult {
    success: boolean;
    output: string;
    error?: string;
}

/**
 * Gitコマンドを実行
 */
async function runGitCommand(command: string, cwd: string): Promise<GitResult> {
    try {
        const { stdout, stderr } = await execAsync(command, { cwd });
        return {
            success: true,
            output: stdout.trim(),
            error: stderr.trim() || undefined,
        };
    } catch (error: unknown) {
        const execError = error as { stdout?: string; stderr?: string; message?: string };
        return {
            success: false,
            output: execError.stdout?.trim() || "",
            error: execError.stderr?.trim() || execError.message || "Unknown error",
        };
    }
}

/**
 * Git repoを初期化
 */
export async function gitInit(cwd: string): Promise<GitResult> {
    return runGitCommand("git init", cwd);
}

/**
 * Gitリポジトリかどうか確認
 */
export async function isGitRepo(cwd: string): Promise<boolean> {
    const result = await runGitCommand("git rev-parse --git-dir", cwd);
    return result.success;
}

/**
 * Git pull
 */
export async function gitPull(cwd: string, remote: string = "origin"): Promise<GitResult> {
    return runGitCommand(`git pull ${remote}`, cwd);
}

/**
 * Git push
 */
export async function gitPush(cwd: string, remote: string = "origin"): Promise<GitResult> {
    return runGitCommand(`git push ${remote}`, cwd);
}

/**
 * Git add all
 */
export async function gitAddAll(cwd: string): Promise<GitResult> {
    return runGitCommand("git add -A", cwd);
}

/**
 * Git commit
 */
export async function gitCommit(cwd: string, message: string): Promise<GitResult> {
    const escapedMessage = message.replace(/"/g, '\\"');
    return runGitCommand(`git commit -m "${escapedMessage}"`, cwd);
}

/**
 * Git clone
 */
export async function gitClone(repoUrl: string, targetDir: string): Promise<GitResult> {
    return runGitCommand(`git clone ${repoUrl} ${targetDir}`, process.cwd());
}

/**
 * Gitのコミットログを取得
 */
export async function getGitLog(
    cwd: string,
    since?: string,
    limit: number = 50
): Promise<GitResult> {
    let command = `git log --oneline -n ${limit}`;
    if (since) {
        command += ` --since="${since}"`;
    }
    return runGitCommand(command, cwd);
}

/**
 * 変更があるか確認
 */
export async function hasChanges(cwd: string): Promise<boolean> {
    const result = await runGitCommand("git status --porcelain", cwd);
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
