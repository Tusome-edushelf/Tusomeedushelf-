# Tusome EduShelf — Free Premium Trial Fix

## Fixed
- The dashboard no longer depends on `/api/plans` just to display the free-trial card.
- Trial status is loaded directly from `/api/my/subscription`.
- Trial cards now show a useful error instead of silently disappearing when the status request fails.
- The Start Trial button is disabled while the request is being submitted.
- The membership page now also shows the 2-day free trial action/status for learners and teachers.
- `/api/my/subscription` now reports the role-appropriate trial plan key and confirms that the plan is active before advertising trial availability.

## Database / M-PESA
The existing server-side PostgreSQL trial implementation remains intact. The M-PESA shortcode/passkey configuration is unchanged.

## Verification
- `server.mjs`: `node --check` passed.
- All inline JavaScript in `index.html`: `node --check` passed.
