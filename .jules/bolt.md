## 2026-01-21 - Lazy loading AI SDKs for CLI startup
**Learning:** Top-level imports of `@ai-sdk/*` and `ollama-ai-provider` add significant overhead (~0.7s) to CLI startup time even when not used.
**Action:** Use `await import()` for heavy dependencies inside the command action or helper functions. Use `import type` for type definitions.
