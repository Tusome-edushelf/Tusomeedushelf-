# TusomeEduShelf v126.48 — Bulk Parent Password PDF

- Changes the bulk parent password reset output from CSV to PDF.
- The PDF contains parent name, username, email, phone, new temporary password, linked learners, and account status.
- Keeps the confirmation step and existing admin-only bulk-reset API; no password-reset logic or database schema changes.
- Individual reset and existing parent credential exports remain unchanged.
- Treat the PDF as highly confidential and distribute each temporary password privately.
- Syntax and ZIP integrity checks are required; live Render/database testing has not been performed.
