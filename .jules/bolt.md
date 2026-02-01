# Bolt's Journal ⚡

## 2024-05-22 - Startup Time Optimization
**Learning:** Top-level imports of heavy libraries (like `ai`, `marked`, `ollama-ai-provider`) in command modules cause significant startup delays for the entire CLI, even when those commands are not used.
**Action:** Always lazy-load heavy dependencies using `await import(...)` inside the command action or helper functions. Use `import type` for type safety without runtime cost.
