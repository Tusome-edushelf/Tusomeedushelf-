# Tusome EduShelf — School Plan Automatic Login Build

This build keeps the existing Tusome EduShelf structure and separates the two entry doors:

1. **Normal Tusome Sign In** — continues to open the normal learner/teacher/parent/admin dashboards.
2. **School Plan Sign In** — uses one school login with school email or phone + password. No school name or account-type selector is required.

After School Plan authentication, the server checks the user's active school membership and returns the assigned school role. The existing school workspace functions are then opened automatically:
- School Admin → School Management
- Bursar / Finance → Finance workspace
- Teacher → School Teacher workspace
- Learner → School Learner workspace
- Parent / Guardian → Parent workspace

The server also adds a phone column/index for school login by Kenyan phone number and persists the optional school administrator phone during school registration.

## Files
- `index.html`
- `server.mjs`

## Deploy
Upload/deploy both files to the existing Render service and restart the service. Do not replace the rest of the Tusome EduShelf project structure.

## Verification
- `node --check server.mjs` passes.
- The School Plan UI has a single automatic-routing login flow.
- `/api/schools/login` validates credentials and active school membership before returning the school role.
