# Tusome EduShelf — Backups & Recovery v14

This release adds an administrator-controlled backup and recovery layer while keeping the existing homepage, AI, learning materials, payments and teacher revenue features.

## Included
- Automatic scheduled backups (default every 24 hours).
- Database records, uploaded learning-material files, payment records, audit logs and curriculum data included in each compressed backup.
- SHA-256 backup integrity checks.
- Admin "Create Backup Now" action.
- Backup download from the Admin dashboard.
- Restore testing before a real restore.
- Full database restore protected by exact admin confirmation: `RESTORE TUSOME EDUSHELF`.
- File versioning: the first upload is version 1; replacement uploads create additional versions.
- Deleted-material recovery bin using soft delete, so files are recoverable.
- Admin confirmation for material deletion and recovery.
- Audit logs for important security, material, backup and recovery actions.

## Environment variables
Optional:
- `BACKUP_INTERVAL_HOURS=24`
- `BACKUP_RETENTION_DAYS=30`
- `BACKUP_DIR=/var/data/tusome-backups` (use a persistent/durable mounted directory when available)

The app can run with its default `data/backups` directory, but a Render filesystem that is not persistent should not be treated as the final disaster-recovery destination. For production, point `BACKUP_DIR` at durable storage or a persistent disk.

## Safety
Full restore replaces current database contents. The Admin dashboard requires the exact confirmation phrase before it can run. Restore testing is non-destructive.

PostgreSQL backup/restore follows the general principle that databases should be backed up regularly and that restore procedures should be tested; PostgreSQL documents dump, filesystem and continuous-archiving approaches in its backup documentation.
