## 2024-05-22 - Regex Optimization Trap
**Learning:** Extracting Regex literals to constants in TypeScript/JS (V8/Bun) can surprisingly degrade performance (4x slower in micro-benchmark). V8 optimizes inline regex literals (`/pattern/`) heavily (Inline Caching).
**Action:** Avoid extracting simple regex literals to constants solely for performance. Only do it for readability or if the regex is constructed dynamically.
