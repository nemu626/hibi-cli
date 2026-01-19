## 2026-01-19 - Lazy Loading Heavy Dependencies
**Learning:** Top-level imports of heavy libraries (like `ai`, `ollama-ai-provider`, `marked`) in command files significantly impact CLI startup time, even for commands that don't use them. Moving them to dynamic imports reduced startup time from ~0.74s to ~0.14s.
**Action:** Use dynamic imports (`await import(...)`) for heavy dependencies within the command action or helper functions. Use `import type` at top level for type safety without runtime cost.
