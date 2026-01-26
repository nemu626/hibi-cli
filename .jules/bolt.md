## 2025-01-26 - [Lazy Loading LLM Providers]
**Learning:** Top-level imports of `ollama-ai-provider` and other AI SDKs can cause runtime crashes (e.g. missing `zod`) and significantly slow down CLI startup.
**Action:** Always lazy load heavy AI SDKs using dynamic `import()` inside the functions that use them, and keep top-level imports as `import type`.
