## 2024-05-23 - Lazy Loading Dependencies in CLI
**Learning:** CLI tools built with Node.js/Bun can suffer from slow startup times if heavy dependencies (like AI SDKs or large markdown parsers) are imported at the top level. Even if the user runs a simple command like `--version` or `--help`, these dependencies are parsed and loaded.
**Action:** Use dynamic `await import(...)` inside command action handlers for heavy dependencies that are only needed for specific commands. This significantly reduces startup time and memory footprint for the general case.
