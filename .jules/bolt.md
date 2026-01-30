## 2025-05-23 - [Lazy Loading Heavy Dependencies]
**Learning:** Eagerly importing heavy dependencies (AI SDKs, `marked`, etc.) not only slows down CLI startup significantly but can also cause crashes if transitive dependencies (like `zod` for `ollama-ai-provider`) are missing, even if the command using them is not invoked.
**Action:** Always use dynamic `await import(...)` for heavy or optional dependencies inside the command action or specific functions, rather than at the top level.
