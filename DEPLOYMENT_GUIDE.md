# Deployment Guide: Patient Cancellation Feature

Complete step-by-step guide to deploy the feature to production.

## ✅ Pre-Deployment Checklist

### Local Development Complete
- [ ] All code written and tested locally
- [ ] `npm run dev` works without errors
- [ ] Cloud Functions build successfully: `cd functions && npm run build`
- [ ] Firestore emulator runs: `firebase emulators:start`

### Repository Ready
- [ ] All files committed to git
- [ ] No uncommitted changes
- [ ] Branch is up to date
- [ ] Code reviewed (if applicable)

### Configuration Ready
- [ ] `.env.local` has correct Firebase credentials
- [ ] `.firebaserc` configured with project ID
- [ ] `firebase.json` updated
- [ ] Firestore security rules reviewed

### Testing Complete
- [ ] All cancellation tests pass locally
- [ ] Real-time updates verified
- [ ] Error handling tested
- [ ] Edge cases tested (concurrent cancels, invalid states)

## 📦 Phase 1: Prepare for Deployment

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

Verify installation:
```bash
firebase --version
```

### Step 2: Authenticate with Firebase

```bash
firebase login
```

This opens a browser window to authenticate with your Google account.

### Step 3: Select Project

```bash
firebase use --add
```

Choose your Firebase project from the list, or specify:
```bash
firebase use project-id
```

Verify selection:
```bash
firebase projects:list
```

### Step 4: Build Cloud Functions

```bash
cd functions
npm install  # Ensure all dependencies installed
npm run build  # Compile TypeScript to JavaScript
cd ..
```

Expected output:
```
> tsc
functions/lib/index.js created
```

### Step 5: Verify Build Artifacts

Check that `functions/lib/` directory exists:
```bash
ls -la functions/lib/
# Should show: index.js, index.js.map, index.d.ts
```

### Step 6: Review Deployment Configuration

Check `firebase.json`:
```json
{
  "functions": {
    "source": "functions",
    "runtime": "nodejs20"
  }
}
```

Verify `.firebaserc`:
```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

## 🚀 Phase 2: Deploy Cloud Functions

### Step 1: Deploy Functions

```bash
firebase deploy --only functions
```

Expected output:
```
Deploy complete!

Function URL: https://region-project-id.cloudfunctions.net/
Functions deployed: 3
  ✔ cancelAppointment
  ✔ verifyAppointmentStatus
  ✔ cleanupOldCancelledAppointments
```

### Step 2: Verify Functions Deployed

```bash
firebase functions:list
```

Should show all three functions deployed.

### Step 3: Monitor Initial Logs

```bash
firebase functions:log
```

Watch for any startup errors (should be empty initially).

## 🔒 Phase 3: Deploy Firestore Rules

### Step 1: Review Security Rules

Verify rules in `IMPLEMENTATION_GUIDE.md` are correct for your setup.

### Step 2: Deploy Rules

```bash
firebase deploy --only firestore:rules
```

Expected output:
```
Deploy complete!

✔ firestore:rules - Deployed successfully
```

### Step 3: Test Rules

In Firebase Console:
1. Go to Firestore Database
2. Try to read appointments collection
3. Verify only authenticated users can read their own
4. Verify Cloud Functions can write

## 🌐 Phase 4: Deploy Next.js Application

### Step 1: Build for Production

```bash
npm run build
```

Expected output:
```
Next.js build successful
✓ Compiled successfully
✓ Optimized production build
```

### Step 2: Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

Expected output:
```
Deploy complete!

Hosting URL: https://project-id.firebaseapp.com
✓ Deployed successfully
```

### Step 3: Verify Deployment

Visit the hosting URL in browser:
```
https://project-id.firebaseapp.com
```

Should load your app without errors.

## 🧪 Phase 5: Post-Deployment Testing

### Test 1: Navigation
```
1. Go to /appointments route
2. Should load MyAppointments component
3. Check browser console for errors
```

### Test 2: Cancellation
```
1. Have test appointment in Firestore
2. Click Cancel button
3. Confirm in dialog
4. Watch for success toast
5. Verify appointment updated in Firestore
```

### Test 3: Real-Time Updates
```
1. Open /appointments in two tabs
2. Cancel from first tab
3. Second tab should update automatically
4. No page refresh required
```

### Test 4: Error Handling
```
1. Try to cancel non-existent appointment
2. Should show error toast
3. Check Cloud Functions logs for error
```

### Test 5: Audit Logging
```
1. Cancel an appointment
2. Check Firestore auditLogs collection
3. Should have entry with correct data
```

## 📊 Phase 6: Monitor Production

### Enable Cloud Function Monitoring

```bash
firebase functions:log
```

Watch for errors in production:
- Any function failures
- Authentication issues
- Firestore permission errors
- Network timeouts

### Set Up Alerts (Firebase Console)

1. Go to Cloud Functions in Firebase Console
2. Click a function
3. Go to Monitoring tab
4. Set up alerts for:
   - Error rate > 1%
   - Execution time > 5 seconds
   - Memory usage > 80%

### Check Performance

In Firebase Console → Functions → Performance:
- Monitor execution times
- Check error rates
- Review logs

## 🔄 Phase 7: Rollback Plan

If issues occur in production:

### Quick Rollback (Functions Only)

```bash
# Deploy previous version
firebase deploy --only functions:cancelAppointment
```

### Full Rollback (Last Stable Version)

```bash
# Checkout previous commit
git checkout previous-commit-hash

# Rebuild and deploy
npm run build
firebase deploy
```

### Disable Feature (Keep Deployed)

In `src/components/MyAppointments.tsx`, wrap cancel button:
```typescript
if (process.env.NEXT_PUBLIC_DISABLE_CANCELLATION === 'true') {
  // Hide cancel button
}
```

Then set environment variable and redeploy.

## 🎯 Deployment Troubleshooting

### Issue: "Permission denied" when deploying

**Solution:**
```bash
# Check you're authenticated
firebase login:list

# Re-authenticate if needed
firebase logout
firebase login
```

### Issue: "Function timeout exceeded"

**Cause:** Cloud Function taking too long
**Solution:** Check Firestore transaction complexity

### Issue: "Quota exceeded"

**Cause:** Too many function invocations
**Solution:** Wait for quota reset or upgrade Firebase plan

### Issue: "Cannot find module"

**Solution:**
```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

### Issue: "Unauthorized: Cloud Functions API is not enabled"

**Solution:**
```bash
# Enable the API in Google Cloud Console
# Or use Firebase CLI to enable
gcloud services enable cloudfunctions.googleapis.com
```

## 📝 Deployment Documentation

### Create Deployment Log

```markdown
# Deployment Log - Patient Cancellation Feature

**Date:** 2024-12-15
**Environment:** Production
**Deployed by:** [Your Name]

## Changes
- MyAppointments component
- Cloud Functions for cancellation
- Firestore rules update

## Testing Results
- ✓ Cancellation works
- ✓ Real-time updates working
- ✓ Audit logging working

## Performance
- Function execution: 250ms avg
- Real-time update: 50ms avg
- No errors in logs

## Next Steps
- Monitor for issues
- Collect user feedback
```

## 🚨 Emergency Procedures

### If Cancellation Broken in Production

1. **Immediate:** Hide cancel button
   - Update MyAppointments to not show button
   - Redeploy next.js app

2. **Diagnostic:** Check Cloud Function logs
   ```bash
   firebase functions:log --lines 100
   ```

3. **Fix:** If function issue:
   - Fix in local environment
   - Test thoroughly
   - Redeploy function

4. **Communicate:** Notify users if data affected

### If Firestore Rules Too Restrictive

1. **Temporarily loosen rules** (if safe)
   ```
   match /appointments/{doc=**} {
     allow read, write: if request.auth != null;
   }
   ```

2. **Redeploy:** `firebase deploy --only firestore:rules`

3. **Fix properly** and redeploy with correct rules

## 📞 Support & Monitoring

### Ongoing Monitoring

```bash
# Check daily
firebase functions:log

# Check weekly
# - Review error rates
# - Monitor performance
# - Check user feedback
```

### Scheduled Maintenance

```bash
# Run cleanup function monthly
firebase functions:call cleanupOldCancelledAppointments
```

### Update Cycle

```bash
# Test on staging first
firebase deploy --project staging-project-id

# Only deploy to production after testing
firebase deploy --project production-project-id
```

## ✅ Final Checklist Before Going Live

- [ ] All code tested locally
- [ ] Cloud Functions built successfully
- [ ] Firestore rules reviewed and correct
- [ ] Environment variables configured
- [ ] Firebase authentication working
- [ ] Database backups created
- [ ] Monitoring and alerts set up
- [ ] Team notified of changes
- [ ] Rollback plan documented
- [ ] User documentation updated
- [ ] Support team trained
- [ ] Performance baseline established

## 📊 Success Metrics

After deployment, monitor:

**Reliability:**
- Function error rate < 0.5%
- All cancellations complete successfully
- No data inconsistencies

**Performance:**
- Avg execution time < 300ms
- 99th percentile < 1 second
- Real-time updates < 100ms

**Usage:**
- Track cancellation rate
- Monitor unique users
- Watch for patterns

**User Satisfaction:**
- Collect feedback
- Monitor support tickets
- Track adoption rate

## 🎓 Post-Deployment Steps

### Day 1
- [ ] Monitor logs continuously
- [ ] Test main user flows
- [ ] Respond to any issues

### Week 1
- [ ] Analyze usage patterns
- [ ] Collect user feedback
- [ ] Verify performance metrics

### Week 4
- [ ] Review deployment success
- [ ] Plan next features
- [ ] Update documentation

## 📚 Documentation Files

Keep updated:
- IMPLEMENTATION_GUIDE.md (if procedures changed)
- QUICK_REFERENCE.md (for quick lookups)
- This file (deployment steps)

---

**Status:** Ready for Production
**Last Verified:** 2024
**Version:** 1.0.0
