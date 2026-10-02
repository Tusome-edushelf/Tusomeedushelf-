# Tusome EduShelf v99 — Multi-Stream Fix

This package fixes the v98 multi-stream edge cases without changing the existing class_id-based school records.

- A logical Class/Grade may have multiple Stream rows (for example Grade 7 → A, B, C).
- All class/stream selectors now display the grade/class and stream clearly.
- Teacher allocations and assignments display the exact stream instead of an ambiguous class name.
- Bulk registration now requires Stream when the selected Class/Grade has multiple streams; a single unambiguous class row may still omit Stream.
- Duplicate streams remain blocked, and a class/grade that already exists cannot also be created as an extra blank “General” row; use Add Stream instead.
- Existing learner accounts, parent links, credentials, DOB validation, reset behavior, attendance, exams, assignments and fees are preserved.
- No database migration is required.

Deploy `index.html` and `server.mjs` together. Do not mix these files with older versions.
