## 2024-05-23 - [CLI Startup Time & Lazy Loading]
**Learning:** Eager imports of heavy libraries (AI SDKs, marked, prompts) in command files significantly slow down CLI startup because `index.ts` imports all commands. Top-level imports in `src/lib/llm/client.ts` propagate this cost transitively.
**Action:** Use `import type` for static analysis and dynamic `await import(...)` inside execution paths (action handlers) to defer loading until needed. This reduced startup from ~0.88s to ~0.15s.
