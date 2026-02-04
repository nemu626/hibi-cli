## 2026-02-04 - [Eager AI SDK Imports Kill CLI Startup]
**Learning:** Top-level imports of `ai` SDKs and `ollama-ai-provider` caused a massive 1.5s+ startup delay (and sometimes crashes due to missing transitive deps) even for simple commands like `hibi --version`.
**Action:** Always use dynamic imports `await import(...)` for heavy AI libraries inside the function that uses them. Use `import type` for types.
