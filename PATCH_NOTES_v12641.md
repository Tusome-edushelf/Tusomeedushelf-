# TusomeEduShelf v126.41 — Safe Parent Password Reset

## Fix
- Adds a school-admin-only password reset action to the existing Parents / Guardians list.
- A reset is allowed only when that parent account is linked to the currently selected school.
- Generates a new random temporary password and stores only its password hash.
- Downloads a one-row CSV with the username, email, phone, and temporary password for secure handover.
- Writes an audit event for the reset.

## Preserved
- No schema or migration changes.
- No parent accounts or parent–learner links are deleted.
- No learner, teacher, exam, report-card, or General Results data is changed.
- Login continues to accept username or email plus password.
- No direct changes to GitHub or Render. Upload/deploy manually after testing.

## Use
1. Deploy this ZIP using the same process as the current version.
2. Sign in as the school administrator and open Registered Members → Parents.
3. Click “Reset password & download CSV” for only the affected parent. Confirm the reset.
4. Share the temporary password privately and ask the parent to change it after login if password-change controls are available.
5. Keep the downloaded CSV private and delete extra copies when no longer needed.

## Verification
- Run `node --check server.mjs`.
- Verify the HTML and inline scripts retain the reset button and handler.
- Verify the ZIP contains the complete existing application files.
