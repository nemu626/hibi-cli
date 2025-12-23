## 2025-12-23 - [Redundant File I/O Checks]
**Learning:** `addTask` was performing ~6 syscalls (`stat`, `read`, `stat`, `write`...) per operation due to redundant checks in `ensureDailyFile` and `readDailyFile`.
**Action:** Use EAFP (try/catch on `readFile`) and combine read/init logic to reduce syscalls. Resulted in ~3.4x speedup for `addTask`.
