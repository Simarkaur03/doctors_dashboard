# Deployment Guide

## Architecture

- **Frontend**: Next.js 16 on Vercel
- **Backend**: Firebase (Firestore, Auth, Storage, Cloud Functions)
- **Monitoring**: Sentry + Firebase

---

## Prerequisites

- Node.js 20+
- Firebase CLI: `npm install -g firebase-tools`
- Vercel CLI: `npm install -g vercel`
- Firebase project access: `doctor-s-dashboard-8d00d`
- Vercel project linked

---

## Environment Variables

### Vercel Dashboard (Frontend)

Set these in **Vercel > Project Settings > Environment Variables**:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes | Firebase Web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes | Firebase Auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Yes | Firebase Storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Yes | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Yes | Firebase app ID |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Sentry DSN for error tracking |

### Local Development

Copy `Frontend/.env.local` and fill in values. Never commit this file.

---

## Deployment Steps

### 1. Frontend (Vercel)

```bash
cd Frontend
npm install
npm run build     # Verify zero errors
npm run lint      # Verify zero warnings
```

Deploy via Git push (auto-deploy) or manually:

```bash
vercel --prod
```

### 2. Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### 3. Firestore Indexes

```bash
firebase deploy --only firestore:indexes
```

### 4. Storage Rules

```bash
firebase deploy --only storage:rules
```

### 5. Cloud Functions

```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

### 6. Full Firebase Deploy

```bash
firebase deploy --only firestore,storage,functions
```

---

## Pre-Deployment Checklist

- [ ] All environment variables set in Vercel
- [ ] `npm run build` passes with zero errors
- [ ] `npm run lint` passes with zero warnings
- [ ] No hardcoded API keys in source code
- [ ] Firestore rules tested locally with emulator
- [ ] Storage rules reviewed
- [ ] Cloud Functions compile successfully
- [ ] Sentry DSN configured (if using Sentry)

---

## Rollback Procedure

### Frontend (Vercel)

1. Go to **Vercel Dashboard > Deployments**
2. Find the last working deployment
3. Click **"..." > Promote to Production**

Or via CLI:

```bash
vercel rollback
```

### Firestore Rules

Firebase does not version rules. Keep a backup before deploying:

```bash
# Before deploying, copy current rules
cp firestore.rules firestore.rules.backup

# To rollback
cp firestore.rules.backup firestore.rules
firebase deploy --only firestore:rules
```

### Cloud Functions

```bash
# Revert to previous commit
git checkout HEAD~1 -- functions/src/index.ts
cd functions && npm run build && cd ..
firebase deploy --only functions
```

### Storage Rules

```bash
cp storage.rules.backup storage.rules
firebase deploy --only storage:rules
```

---

## Monitoring

### Sentry

- Dashboard: Check your Sentry project for runtime errors
- Alerts: Configure in Sentry > Alerts for critical error thresholds

### Firebase Console

- **Authentication**: Monitor sign-ups, sign-ins, failures
- **Firestore**: Monitor reads/writes/deletes usage
- **Functions**: Monitor invocations, errors, execution time
- **Storage**: Monitor upload/download activity

---

## Troubleshooting

### Build fails with missing env vars

Ensure all `NEXT_PUBLIC_FIREBASE_*` variables are set in Vercel.

### Cloud Functions deploy fails

```bash
cd functions
rm -rf node_modules lib
npm install
npm run build
cd ..
firebase deploy --only functions
```

### Firestore permission denied

Check that Firestore rules are deployed and the user has the correct role in their Firestore user document.
