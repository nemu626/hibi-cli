## 2024-05-23 - Lazy Loading Heavy Dependencies
**Learning:** CLI startup time is sensitive to top-level imports. Heavy libraries like `ai`, `@ai-sdk/*`, `marked`, and `prompts` significantly impact startup even for commands that don't use them.
**Action:** Always use dynamic `await import(...)` for heavy dependencies inside the action handler or utility functions, rather than top-level imports. Use `import type` for type safety without runtime cost.
