## 2025-02-23 - Lazy Loading Dependencies
**Learning:** CLI tools importing heavy libraries (marked, @ai-sdk) at the top level suffer significant startup delays.
**Action:** Use dynamic `await import(...)` inside command actions for heavy dependencies to keep startup fast.
