## 2026-01-06 - CLI Startup Performance & Dependency Management
**Learning:** CLI startup time is heavily impacted by top-level imports of large libraries (like AI SDKs, `marked`) even if the user runs a different command or just `--help`. Lazy loading via `await import(...)` inside action handlers significantly reduces this overhead.
**Action:** For all future CLI commands, audit top-level imports. If a dependency is large and only used in specific execution paths (like an action handler), move it to a dynamic import.

**Learning:** `marked` extension registration via `marked.use()` persists on the singleton instance. When lazy loading, ensure `marked.use()` is not called repeatedly or concurrently if multiple calls share the same process (though less critical for single-run CLIs, good practice for testability).
**Action:** Use a singleton wrapper or check for initialization before registering extensions when lazy loading `marked`.

**Learning:** `@ai-sdk` packages may have peer dependency requirements (like `zod`) that are not automatically resolved or cause issues in some environments (Bun/npm interoperability).
**Action:** Explicitly installing the missing peer dependency (e.g., `zod`) can resolve these resolution errors.
