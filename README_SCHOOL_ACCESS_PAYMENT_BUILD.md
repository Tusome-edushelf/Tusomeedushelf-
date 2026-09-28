# Tusome EduShelf — School Access + School Plan Payment Build

## Included
- School Dashboard now starts with a **School Name Verification** step for signed-in users.
- Learners, teachers, school administrators, bursars and parents must enter the registered school name before school access is opened.
- The server verifies the authenticated account against the active school membership. School name alone never grants access.
- If the account is not linked to the entered school, the user receives a clear message to contact the school administrator.
- When the school is verified, Tusome automatically routes the member to the workspace for the verified school role:
  - School Admin → School Management Centre
  - Teacher → Teacher workspace
  - Learner → Learner workspace
  - Parent/Guardian → Parent workspace
  - Bursar → Finance workspace
- School administrators get a **School Plan & Payment** panel inside the School Dashboard.
- School plans are loaded from PostgreSQL, so the displayed plan names/prices come from the existing subscription plan records.
- School plan payments use the existing M-PESA Daraja STK Push configuration.
- Payment status is polled and the school subscription is activated after the Daraja callback confirms payment.
- School subscription payment/status is linked to the school record, not to an individual learner/teacher account.
- When a new school subscription is successfully paid, previous active/pending/requested subscriptions for that same school are closed so the newly paid subscription becomes the active school plan.
- Bursar finance access remains separate from school-plan payment administration; only the school administrator can purchase the school subscription.

## Files
- `index.html`
- `server.mjs`
- `tusome-ai.html`

## Deploy
Replace the corresponding existing files in the current Render project and restart the Node service. Keep the existing environment variables, especially PostgreSQL and M-PESA Daraja settings.

## Important
The build does not grant access from a typed school name. Access requires an authenticated account with an active membership record for that school.
