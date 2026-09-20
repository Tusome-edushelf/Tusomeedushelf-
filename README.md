# Tusome EduShelf v16 — Learner Progress & Saved Materials

This release builds on v15 and adds persistent learner learning history and bookmarks.

## New
- Learner dashboard **Continue Learning** card.
- Learner **Saved Materials** / bookmarks.
- Save/unsave approved materials with a visible bookmark button.
- Persistent learner material activity in PostgreSQL.
- Last-viewed material and view counts per learner.
- Learner activity survives refresh and login on the same account.
- Existing payments, AI, teacher/admin tools, backups and recovery remain included.

## Accessibility
Controls use clear labels and predictable navigation. Important learner actions are surfaced directly on the dashboard, following W3C guidance on findability and clear navigation.

## Database
A new `learner_material_activity` table stores bookmark state, view count and last-viewed time per learner/material.
