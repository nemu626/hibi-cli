# Bolt's Journal

## 2025-02-18 - [Daily File I/O Optimization]
**Learning:** The `addTask` function in `hibi` performs redundant `stat` calls (up to 4 per operation) due to layered abstractions checking file existence.
**Action:** Consolidate file existence checks and reading into a single operation where possible, and avoid repeated checks in calling functions.
