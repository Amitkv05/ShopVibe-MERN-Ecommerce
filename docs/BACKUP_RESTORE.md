# Backup and Restore Guide

## Backup

Use MongoDB Atlas automated backups for production. Confirm retention and restore-window settings before launch. Keep application source in Git and uploaded media in Cloudinary; database backup does not replace provider-level media retention.

## Restore rehearsal

Perform this only against a disposable staging/test database:
1. Create/choose a known backup snapshot.
2. Restore to a new temporary database/cluster target rather than overwriting production.
3. Point a staging backend to the restored database.
4. Run `/health/ready`, login, product read, cart/order read and admin diagnostics.
5. Compare key document counts and a known order/product record.
6. Remove the temporary restore target after evidence is recorded.

A real restore rehearsal is intentionally not marked complete until a real Atlas backup is restored and validated.
