# Tusome EduShelf v60 — Separate School Portal

## School portal changes
- School Plan now appears on the public Home screen as its own dashboard option.
- Added a dedicated School Portal Sign In screen.
- Added a dedicated Create School Plan Account screen.
- School accounts use the separate `school` role and are not Teacher accounts.
- School login opens the independent School Plan Dashboard.
- Teacher accounts no longer become School Dashboard accounts simply because they have school membership.
- School Dashboard contains school-wide management: teachers, learners, classes, resources and academic operations.
- School navigation is shown only for signed-in school accounts (and platform administrators).
- Added PostgreSQL migration for the `school` user role.
- Added `/api/auth/school-register` for dedicated school account creation.
- Existing school workspace and school-management APIs are preserved.
- Existing M-PESA `MPESA_SHORTCODE` and `MPESA_PASSKEY` configuration is unchanged.

## Important
School registration requires PostgreSQL to be ready because school accounts and school workspaces are stored server-side.
