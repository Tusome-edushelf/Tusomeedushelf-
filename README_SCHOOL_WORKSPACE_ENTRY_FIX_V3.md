# Tusome EduShelf — School Workspace Entry Fix V3

This update fixes the school workspace entry boundary.

## Behaviour
- A normal Tusome sign-in keeps the user in the normal learner/teacher/parent dashboard.
- A successful School Dashboard sign-in sets a dedicated school-session flag and opens the School Dashboard page first.
- School teacher/learner/parent/bursar workspaces are rendered inside the School Dashboard rather than the normal dashboards.
- The School Account Access panel is hidden after successful school sign-in.
- If a school session tries to navigate to a normal learner/teacher/admin page, the navigation is intercepted and kept inside the authorised school workspace.
- School workspace module buttons no longer call the normal `show('teacher')`, `show('learner')`, etc. route.

## Deployment
Replace the existing `index.html` and `server.mjs` with the files in this package and redeploy the Render service.

After deployment, sign out of the browser and start a fresh School Dashboard sign-in so the old session state is not reused.
