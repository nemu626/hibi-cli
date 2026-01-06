import fs from "node:fs/promises";
import os from "node:os";

export interface ShellHistoryEntry {
    timestamp: Date;
    command: string;
}

/**
 * zsh履歴ファイルから指定日時以降の履歴を取得
 */
export async function getZshHistory(
    historyPath: string,
    since: Date,
): Promise<ShellHistoryEntry[]> {
    const expandedPath = historyPath.replace(/^~/, os.homedir());
    // ファイルの存在確認
    try {
        await fs.access(expandedPath);
    } catch {
        // ファイルが存在しない場合は空配列を返す
        return [];
    }

    // utf-8で読み込めない場合を考慮して、bufferとして読み込んでからデコードを試みることもできるが、
    // 一般的なユースケースとしてutf-8を仮定する。
    // zshのEXTENDED_HISTORYオプションが有効であることを前提とする。
    const content = await fs.readFile(expandedPath, "utf-8");
    const lines = content.split("\n");
    const entries: ShellHistoryEntry[] = [];
    const sinceTime = since.getTime();

    for (const line of lines) {
        // zsh history format: : 1673330000:0;command
        // 先頭の : をマッチ、タイムスタンプをキャプチャ、コマンド部分をキャプチャ
        const match = line.match(/^: (\d+):\d+;(.*)$/);
        if (match?.[1] && match[2] !== undefined) {
            const timestampSec = parseInt(match[1], 10);
            const timestampMs = timestampSec * 1000;

            if (timestampMs >= sinceTime) {
                entries.push({
                    timestamp: new Date(timestampMs),
                    command: match[2].trim(),
                });
            }
        }
    }

    return entries;
}
