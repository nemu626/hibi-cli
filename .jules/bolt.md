## 2024-05-22 - Heavy Dependencies in CLI Entry Points
**Learning:** Top-level imports of heavy libraries (like `ollama-ai-provider`, `@ai-sdk/*`, `marked`) in CLI commands cause massive startup delays and potential crashes if dependencies are missing, even for unrelated commands. Lazy loading via dynamic `import()` is essential for CLI responsiveness and stability.
**Action:** Always audit top-level imports in command files. Use dynamic imports for any heavy or optional dependency within the command action.
