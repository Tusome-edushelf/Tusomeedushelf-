# Tusome EduShelf v59 — Separate School Plan Dashboard

Changes:
- School Plan Dashboard is separate from the Teacher Dashboard.
- Teacher Dashboard no longer contains the School Management quick action.
- School administrators get a dedicated School Dashboard button in the top navigation.
- School dashboard access is verified against the user's active school membership (`member_role=admin`).
- A teacher account that owns a school can still use the Teacher Dashboard for teaching and the separate School Dashboard for school administration.
- New school-plan requests automatically make the requesting account the school administrator (`member_role=admin`).
- Added school-plan status display inside the School Plan Dashboard.
- Existing M-PESA shortcode/passkey configuration is unchanged.
