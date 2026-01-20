## 2024-05-22 - CLI Startup Optimization
**Learning:** Top-level imports of heavy libraries (AI SDKs, marked) significantly slow down CLI startup (600ms -> 200ms). Lazy loading via dynamic `import()` is highly effective but requires handling type safety (using `import type` or casts).
**Action:** Always verify top-level imports in CLI commands and move heavy ones to dynamic imports inside the action handler.
