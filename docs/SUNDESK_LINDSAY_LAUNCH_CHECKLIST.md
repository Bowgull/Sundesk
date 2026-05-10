# Sundesk Lindsay Launch Checklist

Status: local-only. No deploy has run. Firestore writes require explicit approval.

This checklist is the remaining path from local build to Lindsay-ready hosted web app. Do not paste private emails, secrets, screenshots with private values, real records, SALTXC data, permit contents, COI files, or contract text into this repo.

## 1. Firebase Console

Create or confirm one Firebase project for Sundesk.

- Plan: Spark.
- Billing: off.
- Web app: added.
- Hosting: enabled.
- Authentication: enabled.
- Firestore Database: enabled.

Keep these off for V1:

- Cloud Functions.
- Cloud Storage.
- App Hosting.
- Extensions.
- Imports.
- Scheduled jobs.

## 2. Google Login

In Firebase Console:

1. Open Authentication.
2. Open Sign-in method.
3. Enable Google.
4. Add the app domain after Hosting exists.
5. Do not add broad team access.

The app also checks `VITE_SUNDESK_ALLOWED_EMAILS` locally. Keep that list in `.env.local` only.

## 3. Firestore Allowlist

Create the allowlist by hand in Firebase Console.

1. Open Firestore Database.
2. Create the collection `allowedUsers`.
3. Create one document per approved Google account.
4. Use the approved email address as the document ID.
5. Add only non-secret metadata fields.

Example shape:

```json
{
  "role": "owner",
  "createdAt": "manual"
}
```

Rules deny client writes to `allowedUsers`. Do not commit the real document IDs.

## 4. Firestore Workspace

The shared workspace path is fixed:

- `workspaces/lindsay-sundesk`
- `workspaces/lindsay-sundesk/state/current`
- subcollections under `workspaces/lindsay-sundesk`

Only signed-in allowlisted users can read or write this tree. Every other Firestore path is denied.

Do not enable Firestore writes until the user explicitly approves it. The write gate is:

```bash
VITE_SUNDESK_FIRESTORE_WRITES=enabled
```

Leave it blank for local verification without remote writes.

## 5. Environment Variables

Create `.env.local` from `.env.example`.

Required for Firebase-backed local verification:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_SUNDESK_ALLOWED_EMAILS=
VITE_SUNDESK_FIRESTORE_WRITES=
```

Rules:

- Keep `.env.local` uncommitted.
- Keep private emails out of docs.
- Keep `VITE_SUNDESK_FIRESTORE_WRITES` blank until write approval.
- Set `VITE_SUNDESK_ALLOWED_EMAILS` to the approved Google accounts in `.env.local` only.

## 6. Local Verification

Run:

```bash
npm run lint
npm run build
npm run preview
```

Then test the preview URL with fake data only:

1. Confirm Today opens as home.
2. Confirm Build is visible in the sidebar.
3. Sign in with an approved Google account.
4. Confirm an unapproved Google account is blocked.
5. Open Build.
6. Create a fake table or fake record.
7. Refresh.
8. Confirm local state remains usable.
9. Open Settings.
10. Confirm the quiet data-boundary note is there.
11. Confirm Firestore writes are shown as disabled unless approval has been given.

If write approval has not been given, stop here. No remote write test should run.

## 7. Deploy

Deploy only after explicit approval.

```bash
npm run build
firebase deploy --only hosting,firestore:rules,firestore:indexes
```

After deploy:

1. Open the hosted URL.
2. Sign in with an approved Google account.
3. Confirm an unapproved Google account is blocked.
4. Confirm Today remains home.
5. Confirm Build remains visible in the sidebar.
6. Confirm Settings contains the quiet data-boundary note.
7. Confirm no real Lindsay or SALTXC data is present.

Firestore writes still require explicit approval. Deploying Hosting and rules is not write approval.

## 8. Mobile Install Check

On iPhone:

1. Open the hosted URL in Safari.
2. Use Share.
3. Choose Add to Home Screen.
4. Confirm the name is Sundesk.
5. Confirm the icon appears.
6. Open from the home screen.
7. Confirm Google sign-in works.
8. Confirm Today opens first.
9. Confirm Build is reachable from the sidebar.

On Android:

1. Open the hosted URL in Chrome.
2. Use Install app or Add to Home screen.
3. Confirm the name is Sundesk.
4. Confirm the icon appears.
5. Open from the launcher.
6. Confirm Google sign-in works.
7. Confirm Today opens first.
8. Confirm Build is reachable from the sidebar.

## 9. Desktop Bookmark Check

On desktop:

1. Open the hosted URL in Chrome or Safari.
2. Create a bookmark named Sundesk.
3. Confirm the favicon appears.
4. Reopen from the bookmark.
5. Confirm the session persists.
6. Confirm Today opens first.
7. Confirm Build is reachable from the sidebar.

## 10. Backup And Rollback

Before enabling Firestore writes:

- Keep the local browser build as the fallback.
- Export or preserve any local fake verification data only if needed for testing.
- Do not migrate real records until the hosted path is approved.
- Treat Firestore as empty until a deliberate first write is approved.

If Firestore setup fails:

1. Leave `VITE_SUNDESK_FIRESTORE_WRITES` blank.
2. Use the local browser fallback.
3. Fix Firebase Console setup, rules, or allowlist.
4. Re-run lint and build.
5. Re-test sign-in before any write gate is enabled.

If Firestore writes are enabled and a bad write happens:

1. Disable the write gate.
2. Stop using the hosted write path.
3. Restore from the last known good Firestore export or console backup if one exists.
4. Fall back to local browser state until the workspace snapshot is verified.

No Firebase write is automatic approval. The gate exists so the approval is visible.
