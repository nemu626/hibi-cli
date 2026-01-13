## 2026-01-13 - Lazy Loading Heavy Dependencies

**Learning:** Large dependencies like `marked` and AI SDKs significantly slow down CLI startup (5.6s -> 0.28s). Lazy loading them with dynamic `import()` inside commands is a highly effective optimization.
**Action:** Always lazy load heavy dependencies in CLI commands that are not used in the critical path (e.g., `init` or `help`).

**Learning:** `marked.use()` in a lazy-loaded context needs care.
**Action:** While `marked` is a singleton, ensuring `.use()` is called is necessary. In CLI one-off runs, repeated calls might be okay, but checking initialization state is safer for long-running processes (though CLI usually isn't one).

**Learning:** `prompts` requires `.default` access when imported dynamically.
**Action:** Use `const prompts = (await import("prompts")).default;`.
