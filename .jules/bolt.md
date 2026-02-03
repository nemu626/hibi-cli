## 2024-02-03 - Lazy Load Heavy Dependencies
**Learning:** Top-level imports of heavy libraries (like AI SDKs) in modules that are eagerly loaded (via `index.ts` command registration) cause massive startup slowdowns and potential crashes due to missing transitive dependencies (e.g., `zod` in `ollama-ai-provider`).
**Action:** Always verify import graphs. For CLI tools, lazy-load heavy dependencies using `await import(...)` inside the command action handler or utility functions. Use `import type` for type safety without runtime cost.
