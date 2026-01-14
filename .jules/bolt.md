## 2026-01-14 - Lazy Loading Heavy Dependencies
**Learning:** Top-level imports of heavy libraries (like AI SDKs, `marked`, `prompts`) in CLI commands significantly impact startup time because `commander` (in the current usage) loads all command files at initialization.
**Action:** Use dynamic `import()` inside the command action handlers or specific functions that use these libraries. For CLI tools, deferring imports until execution is critical for responsiveness. Convert synchronous handlers to `async` to accommodate dynamic imports.
