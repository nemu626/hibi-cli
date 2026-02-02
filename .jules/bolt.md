## 2026-02-02 - CLI Startup Bottleneck
**Learning:** Top-level imports of heavy libraries (AI SDKs, marked, prompts, colors) in command files cause significant startup delays because `src/index.ts` eagerly imports all commands.
**Action:** Always use dynamic `await import(...)` for heavy dependencies inside command actions.
