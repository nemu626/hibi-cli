## 2024-05-22 - Lazy Loading Heavy Dependencies
**Learning:** Top-level imports of heavy libraries (like `ai`, `marked`, `ollama-ai-provider`) in CLI commands significantly slow down startup time. Specifically, `ollama-ai-provider` triggered a runtime crash due to missing transitive dependencies when imported eagerly.
**Action:** Always use dynamic `import()` for heavy dependencies inside command actions. This keeps the CLI startup fast (~0.1s vs 5s) and avoids side-effect crashes from unused providers.
