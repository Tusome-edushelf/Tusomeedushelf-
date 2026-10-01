# Tusome EduShelf v85 — Bulk Registration Open Fix

Fixes the Quick Actions **📥 Bulk Register Learners** button. The previous button attempted to scroll to a file input inside `#schoolWorkspace`, but that workspace is initially `display:none`, so nothing happened.

v85 adds `openBulkLearnerRegistration()` which ensures the selected school workspace is loaded/visible before scrolling to the CSV input.

Files: index.html, server.mjs
