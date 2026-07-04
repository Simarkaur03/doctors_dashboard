#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../../"
firebase emulators:start --only firestore,auth,storage --project doctor-dashboard-test
