# Tusome EduShelf — Tusome AI + Notes Generator Fix

This update preserves the existing EduShelf structure and restores the separate `tusome-ai.html` page.

## Changes
- Keeps the original standalone Tusome AI page and its existing chat/history/file/Study Mode/export structure.
- Keeps the visible **✨ Tusome AI** button in EduShelf.
- Adds **📝 Notes Generator** as the replacement for the previous imported KICD/Curriculum Catalogue structure.
- Removes the user-facing KICD curriculum catalogue and its hard-coded curriculum seed content.
- Notes are generated as original content and include official KICD/KNEC reference links for verification instead of hosting copied curriculum documents.
- Adds a server-side notes instruction that avoids reproducing protected KICD/KNEC/publisher material and tells users to verify against official sources.
- Leaves the legacy `curriculum_data` database table in place for migration/backup compatibility, but the current UI no longer imports, displays, or seeds curriculum records from it.

## Deploy
Deploy these three files to the same Render service:
- `index.html`
- `server.mjs`
- `tusome-ai.html`

Then restart/redeploy the Render service.

The standalone AI page must remain in the same deployed directory as `index.html` so `/tusome-ai.html` resolves correctly.
