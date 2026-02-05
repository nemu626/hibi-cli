## 2026-02-05 - Lazy Loading AI SDKs
**Learning:** The CLI architecture eagerly loads all command modules at startup. Top-level imports of heavy libraries (like `ai`, `@ai-sdk/*`) in any command file significantly slow down the entire CLI (e.g., `hibi --version` took ~0.8s).
**Action:** Always use dynamic `await import(...)` for heavy dependencies within the command action or helper functions, rather than at the top level.
