## 2024-05-22 - [Lazy Loading Critical for CLI Performance & Stability]
**Learning:** Top-level imports of heavy AI SDKs (`@ai-sdk/*`, `ollama-ai-provider`) in shared library files (`src/lib/llm/client.ts`) cause massive startup delays (~6s -> ~0.12s) and can trigger runtime crashes due to transitive dependency issues (e.g. `zod` in `ollama`).
**Action:** Always use `import type` for interfaces and `await import()` for implementation logic inside functions for any AI or heavy UI library in CLI tools.
