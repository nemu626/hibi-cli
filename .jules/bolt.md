## 2024-05-22 - [Lazy Loading Dependencies]
**Learning:** Top-level imports in TypeScript/Bun can significantly slow down CLI startup time even for unused commands. Dynamic imports are a powerful tool for lazy loading.
**Action:** Audit top-level imports in all CLI commands and lazy load heavy dependencies like 'marked' or 'yaml' where possible.
