# Backup & Recovery Strategy

## Firestore Backups

### Scheduled Exports (Recommended)

Use Google Cloud to schedule automatic Firestore exports:

```bash
# One-time setup: create a Cloud Storage bucket for backups
gcloud storage buckets create gs://doctor-dashboard-backups \
  --project=doctor-s-dashboard-8d00d \
  --location=us-central1

# Manual export
gcloud firestore export gs://doctor-dashboard-backups/$(date +%Y-%m-%d) \
  --project=doctor-s-dashboard-8d00d
```

### Automated Daily Backups

Create a Cloud Scheduler job:

```bash
gcloud scheduler jobs create http firestore-daily-backup \
  --schedule="0 2 * * *" \
  --uri="https://firestore.googleapis.com/v1/projects/doctor-s-dashboard-8d00d/databases/(default)/exportDocuments" \
  --http-method=POST \
  --oauth-service-account-email=YOUR_SERVICE_ACCOUNT@doctor-s-dashboard-8d00d.iam.gserviceaccount.com \
  --message-body='{"outputUriPrefix":"gs://doctor-dashboard-backups"}' \
  --time-zone="UTC"
```

### Restore from Backup

```bash
# List available backups
gcloud storage ls gs://doctor-dashboard-backups/

# Restore a specific backup
gcloud firestore import gs://doctor-dashboard-backups/2026-07-02 \
  --project=doctor-s-dashboard-8d00d
```

**Warning:** Importing overwrites existing documents with the same IDs.

---

## Firebase Storage Backups

Storage files are durable by default (Google Cloud Storage). For additional protection:

```bash
# Sync storage to a backup bucket
gsutil -m rsync -r gs://doctor-s-dashboard-8d00d.firebasestorage.app \
  gs://doctor-dashboard-backups/storage/$(date +%Y-%m-%d)
```

### Restore Storage

```bash
gsutil -m rsync -r gs://doctor-dashboard-backups/storage/2026-07-02 \
  gs://doctor-s-dashboard-8d00d.firebasestorage.app
```

---

## Firebase Authentication

Firebase Auth data cannot be exported via Firestore exports. Use the Firebase Admin SDK:

```bash
firebase auth:export users.json --project=doctor-s-dashboard-8d00d
```

### Restore Users

```bash
firebase auth:import users.json --project=doctor-s-dashboard-8d00d
```

---

## Recovery Priorities

| Priority | Data | RPO | Method |
|----------|------|-----|--------|
| Critical | User accounts | 24h | Firebase Auth export |
| Critical | Appointments | 24h | Firestore export |
| High | Patient profiles | 24h | Firestore export |
| High | Doctor availability | 24h | Firestore export |
| Medium | Notifications | 48h | Firestore export |
| Medium | Uploaded files | 7d | Storage rsync |
| Low | Audit logs | 7d | Firestore export |

---

## Testing Recovery

Run a recovery drill quarterly:

1. Export Firestore to backup bucket
2. Create a test Firebase project
3. Import the backup into the test project
4. Verify data integrity
5. Document any issues
