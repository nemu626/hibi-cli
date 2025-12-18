
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { addTaskWithParent, ensureDailyFile } from "../../lib/daily";
import { getTodayString } from "../../lib/utils";

const TEST_DIR = "test_daily_parent";
const PROJECT_ROOT = join(process.cwd(), TEST_DIR);
const DATE_STR = getTodayString();

describe("daily > addTaskWithParent", () => {
    beforeEach(() => {
        if (existsSync(PROJECT_ROOT)) {
            rmSync(PROJECT_ROOT, { recursive: true, force: true });
        }
        mkdirSync(PROJECT_ROOT, { recursive: true });

        // Mock hibi.yaml to define project root
        writeFileSync(join(PROJECT_ROOT, "hibi.yaml"), "remote: origin\n", "utf-8");

        // Setup initial daily file
        ensureDailyFile(PROJECT_ROOT, "default", DATE_STR);
    });

    afterEach(() => {
        if (existsSync(PROJECT_ROOT)) {
            rmSync(PROJECT_ROOT, { recursive: true, force: true });
        }
    });

    it("should add a child task under a parent task", () => {
        // Setup a parent task
        const initialContent = `# 2025-12-18

## Todo
- [ ] Parent Task 1
- [ ] Parent Task 2

## Memo
`;
        const filePath = join(PROJECT_ROOT, "projects", "default", "daily", `${DATE_STR}.md`);
        writeFileSync(filePath, initialContent, "utf-8");

        // Add child task to Parent Task 1 (ID: 1)
        addTaskWithParent(PROJECT_ROOT, 1, "Child Task 1", "default", DATE_STR);

        const content = readFileSync(filePath, "utf-8");
        const lines = content.split("\n");

        // Verify structure
        // - [ ] Parent Task 1
        //   - [ ] Child Task 1
        // - [ ] Parent Task 2

        const parentIndex = lines.findIndex(l => l.includes("Parent Task 1"));
        expect(parentIndex).toBeGreaterThan(-1);
        expect(lines[parentIndex + 1]).toMatch(/^\s{2}- \[ \] Child Task 1/);
        expect(lines[parentIndex + 2]).toMatch(/^- \[ \] Parent Task 2/);
    });

    it("should add a child task after existing children", () => {
         // Setup a parent task with an existing child
         const initialContent = `# 2025-12-18

## Todo
- [ ] Parent Task 1
  - [ ] Existing Child
- [ ] Parent Task 2

## Memo
`;
        const filePath = join(PROJECT_ROOT, "projects", "default", "daily", `${DATE_STR}.md`);
        writeFileSync(filePath, initialContent, "utf-8");

        // Add another child task to Parent Task 1 (ID: 1)
        addTaskWithParent(PROJECT_ROOT, 1, "New Child", "default", DATE_STR);

        const content = readFileSync(filePath, "utf-8");
        const lines = content.split("\n");

        // Verify structure
        // - [ ] Parent Task 1
        //   - [ ] Existing Child
        //   - [ ] New Child
        // - [ ] Parent Task 2

        const parentIndex = lines.findIndex(l => l.includes("Parent Task 1"));
        expect(parentIndex).toBeGreaterThan(-1);
        expect(lines[parentIndex + 1]).toMatch(/^\s{2}- \[ \] Existing Child/);
        expect(lines[parentIndex + 2]).toMatch(/^\s{2}- \[ \] New Child/);
        expect(lines[parentIndex + 3]).toMatch(/^- \[ \] Parent Task 2/);
    });

    it("should handle deeply nested tasks", () => {
        // Setup nested structure
        const initialContent = `# 2025-12-18

## Todo
- [ ] Level 1
  - [ ] Level 2

## Memo
`;
       const filePath = join(PROJECT_ROOT, "projects", "default", "daily", `${DATE_STR}.md`);
       writeFileSync(filePath, initialContent, "utf-8");

       // Add child task to Level 2 (ID: 2)
       addTaskWithParent(PROJECT_ROOT, 2, "Level 3", "default", DATE_STR);

       const content = readFileSync(filePath, "utf-8");
       const lines = content.split("\n");

       // Verify structure
       // - [ ] Level 1
       //   - [ ] Level 2
       //     - [ ] Level 3

       const level2Index = lines.findIndex(l => l.includes("Level 2"));
       expect(level2Index).toBeGreaterThan(-1);
       expect(lines[level2Index + 1]).toMatch(/^\s{4}- \[ \] Level 3/);
   });

   it("should report error if parent ID not found", () => {
        // Bun test doesn't have spyOn in the same way as Jest/Jasmine in some versions, or it needs specific import.
        // Let's use a simple mock.
        const originalConsoleError = console.error;
        let called = false;
        let message = "";
        console.error = (msg: string) => {
            called = true;
            message = msg;
        };

        try {
            addTaskWithParent(PROJECT_ROOT, 999, "Orphan Task", "default", DATE_STR);
            expect(called).toBe(true);
            expect(message).toContain("ID 999 のタスクが見つかりません");
        } finally {
            console.error = originalConsoleError;
        }
   });
});
