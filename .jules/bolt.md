## 2024-05-23 - CLI Startup Optimization via Lazy Loading
**Learning:** Top-level imports of heavy libraries (specifically AI SDKs, `marked`, and `prompts`) caused significant CLI startup delay (~500ms).
**Action:** Use dynamic `import()` inside command actions or helper functions for these dependencies. This reduced startup time to ~120ms (4x improvement).
