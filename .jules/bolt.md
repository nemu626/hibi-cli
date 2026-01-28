## 2025-01-28 - CLI Startup Performance & Lazy Loading
**Learning:** Eager loading of command modules in `src/index.ts` combined with top-level imports of heavy libraries (AI SDKs, marked, prompts) in those modules caused a massive startup delay (5.5s -> 0.12s).
**Action:** Use dynamic `await import(...)` for heavy dependencies inside command actions. For Typescript, use `import type` at the top level to preserve type safety without runtime cost.
