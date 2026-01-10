## 2026-01-10 - Lazy Loading Heavy Dependencies
**Learning:** Heavy dependencies like `marked` and `marked-terminal` can significantly slow down CLI startup time if imported at the top level, even if the command using them is not invoked.
**Action:** Use dynamic imports (`await import(...)`) inside the command action or helper functions to load these dependencies only when needed. Ensure extensions are registered only once. This reduced startup time from ~2.4s to ~0.35s.
