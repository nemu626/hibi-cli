## 2024-12-26 - [Avoid Redundant Writes in File Creation]
**Learning:** When creating files that require parent directories, checking for file existence (`existsSync`) and writing a temporary template before immediately overwriting it with actual content is a common anti-pattern.
**Action:** Use `mkdirSync(dirname, { recursive: true })` which is idempotent and efficient. Create a helper like `ensureDir` and separate "ensure file with template" logic from "overwrite file with content" logic to avoid double writes.
