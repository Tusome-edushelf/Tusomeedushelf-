# Tusome EduShelf v109 — PDF Download Fix

Fixes credential PDF generation/download. Defines the PDF text escaping helper that was missing in v108 and generates byte-correct PDF objects/xref offsets using an ASCII-safe table renderer. Keeps v108 safe-resume registration and all prior school/class/stream/credential rules.

Manual deployment: replace `server.mjs` and `index.html` together, deploy, then hard-refresh. Verify `/api/version` reports `v109-pdf-download-fix`.
