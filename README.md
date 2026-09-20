# Tusome EduShelf v30 — Learner Material Reader

v30 adds a focused reading/study interface for approved learner materials.

## Added
- Dedicated Learner Material Reader page
- Embedded document viewing using the existing `/api/materials/:id/file` endpoint
- Clear material title, subject, grade and topic metadata
- Save/bookmark control inside the reader
- Download control as a fallback when the browser cannot display the file
- Loading and display-failure states
- Back-to-materials navigation
- Learner-only access protection
- Responsive layout for desktop and mobile

## Preserved
Existing AI, learner personalization, study planner, teacher material management, admin command centre, notifications, accessibility, payments and B2C functionality are preserved from v29.


## v31 — Learner Notes & Highlights
- Added notes and key highlights to the learner material reader.
- Notes/highlights are stored per material in localStorage on the learner's device.
- Added delete and clear controls with accessible status feedback.
- Existing reader, bookmarks, downloads, AI and platform workflows preserved.
- Note: the legacy app.js contains pre-existing duplicate declarations and is not loaded by the main index page; the active inline frontend and server pass syntax checks.
