# TusomeEduShelf v126.27 — Reference-Style CBE Report Card

- Reworked the official learner report card PDF to a compact one-page A4 portrait layout inspired by the supplied reference image.
- Added identity header, performance banner, subject breakdown table, class-average comparison, longitudinal trend, target tracking, teacher/principal remarks, stamp area and term/fee footer.
- Report-card grades now display Kenya CBE-style levels: EE1, EE2, ME1, ME2, AE1, AE2, BE1, BE2.
- The CBE percentage bands are centralized in the report-card renderer and server mean-grade calculation.
- Existing published-result security, stream bulk download, learner/parent downloads, general results and exam workflow are retained.
- No database schema changes or destructive SQL.

Note: CBE level thresholds are implemented as the application's configurable display bands; schools should align them with their approved grading policy if different.
