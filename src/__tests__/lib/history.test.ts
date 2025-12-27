import { expect, test, describe, beforeAll, afterAll } from "bun:test";
import { getZshHistory } from "../../lib/history";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

describe("getZshHistory", () => {
    const tmpDir = os.tmpdir();
    const historyFile = path.join(tmpDir, ".zsh_history_test");

    // Timestamp:
    // 1600000000: 2020/09/13 (Old)
    // 1700000000: 2023/11/14 (Recent)
    // 1500000000: 2017/07/14 (Very Old)
    const content = `
: 1600000000:0;ls -la
: 1700000000:0;echo "recent command"
: 1500000000:0;echo "old command"
`;

    beforeAll(async () => {
        await fs.writeFile(historyFile, content, "utf-8");
    });

    afterAll(async () => {
        await fs.unlink(historyFile).catch(() => { });
    });

    test("should return entries after since date", async () => {
        const since = new Date(1650000000 * 1000); // 2022
        const entries = await getZshHistory(historyFile, since);

        expect(entries).toHaveLength(1);
        expect(entries[0].command).toBe('echo "recent command"');
    });
});
