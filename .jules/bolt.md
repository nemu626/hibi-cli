## 2024-05-22 - Startup Performance
**Learning:** Top-level imports of heavy libraries (like AI SDKs) slow down the CLI startup significantly, even for commands that don't use them.
**Action:** Use dynamic imports (lazy loading) for heavy dependencies that are only used in specific commands.
