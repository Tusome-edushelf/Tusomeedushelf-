# Tusome EduShelf — KICD/CBE + KJSEA Library Upgrade

## Included
- `index.html`
  - CBE/KJSEA metadata fields on material upload
  - official KICD/KNEC source catalogue inside Digital Library
  - upload shortcut for CBE/KJSEA materials
- `server.mjs`
  - material metadata columns
  - teacher/admin upload support
  - `/api/cbe-library/catalog`
  - metadata returned in Digital Library material records
- `tusome-ai.html`
  - unchanged Tusome AI structure

## Deployment
Deploy all three files together and restart the Render Node service.

## Rights workflow
Use the official KICD/KNEC source URL for official resources. Upload a file only where Tusome EduShelf/school/teacher has permission to host it. For material without redistribution permission, keep the official source link instead.

KJSEA sample papers, rubrics and OMR guidance are linked to official KNEC sources. Confidential assessment materials should not be uploaded or redistributed.
