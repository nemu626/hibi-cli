## 2024-05-22 - Lazy Loading AI SDKs
**Learning:** The `ai`, `@ai-sdk/openai`, and `@ai-sdk/google` packages are extremely heavy (~360ms to import). Top-level imports in command files cause `hibi --help` or any command to pay this cost even if AI features aren't used.
**Action:** Always use dynamic `await import(...)` for AI SDKs inside the command action handler to keep CLI startup snappy.
