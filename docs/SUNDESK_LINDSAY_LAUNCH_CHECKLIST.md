# Sundesk Lindsay Launch Checklist

Status: local-only. No deploy has run. Firestore writes require separate explicit approval.

This checklist is the remaining path from local build to Lindsay-ready hosted web app. Do not paste private emails, secrets, screenshots with private values, real records, SALTXC data, permit contents, COI files, or contract text into this repo.

## Command-Send Preview Boundary

The Today summary control is local-only in this build.

- `Preview summary` should be enabled on Today.
- Clicking it should show a command-send preview only.
- The preview should include Now, Waiting, Next, and meeting prep context.
- The preview should state that no send happened.
- No email, text, webhook, scheduled job, Firebase write, or external sender is connected by this control.

External send requires private deploy setup, explicit send-channel configuration, and separate approval. Do not treat the local preview as a send path.

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

Hosted preflight:

```bash
npm run preflight
```

Preflight is the expected release gate before deploy.

Then test the preview URL with fake data only. No private emails, real records, SALTXC data, permit contents, COI contents, contract text, or setup screenshots with private values.

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
11. Confirm Settings shows the actual Export backup and Import backup controls.
12. Confirm the Settings Launch readiness panel is visible.
13. Confirm Settings shows the install/bookmark path.
14. Confirm Firestore writes are shown as disabled unless approval has been given.
15. Open Today and click Preview summary.
16. Confirm the command-send preview says no send happened.
17. Confirm the preview includes Now, Waiting, Next, and meeting prep context.

If write approval has not been given, stop here. No remote write test should run.

## 6A. Settings Launch Readiness Panel

Settings should show one manual launch readiness panel before deploy.

The panel should confirm:

- Local backup rehearsal. Pending on first read. Complete only after the fake-data Export backup and Import backup round trip has been rehearsed locally.
- Firebase config status. Local, partial, sign-in-ready, or write-ready from the private environment config.
- Deploy approval. Pending until explicit deploy approval is given.
- Write approval. Pending until explicit Firestore write approval is given.
- No Firebase writes. Confirmed while `VITE_SUNDESK_FIRESTORE_WRITES` is blank and Settings shows writes disabled.

On a fresh local run, Launch readiness should start with the backup rehearsal pending. After a successful fake-data Export backup and Import backup round trip, the backup item may become complete. If the panel shows any pending item, stop at the local build. Deploy approval is not write approval. A backup rehearsal is not write approval. No Firebase write is implied by any other check.

## 7. Local Fake-Data Backup And Import Rehearsal

Run this before any Firestore write approval is requested.

Scope:

- Local browser data only.
- Fake verification data only.
- No real Lindsay records.
- No SALTXC data.
- No private contact data.
- No permit contents.
- No COI contents.
- No contract text.
- No setup screenshots with private values.
- No deploy.
- No Firebase writes.

Steps:

1. Keep `VITE_SUNDESK_FIRESTORE_WRITES` blank.
2. Use the local preview or local browser build only.
3. Create a tiny fake dataset that proves tables, fields, tags, links, and views still behave.
4. Open Settings.
5. Confirm Settings contains the actual Export backup and Import backup controls.
6. Use Export backup to preserve that fake local state as JSON.
7. Clear or isolate the local browser state only if needed for the rehearsal.
8. Use Import backup to restore the exported JSON back into the local app.
9. Confirm Settings Launch readiness changes the local backup rehearsal item from pending to complete.
10. Confirm the restored fake dataset matches the exported fake dataset.
11. Confirm tables, fields, tags, links, and views survived the local round trip.
12. Confirm Today remains home.
13. Confirm Build remains visible in the sidebar.
14. Confirm the restored data is fake.
15. Confirm Settings still shows Firestore writes as disabled.

Stop after the local rehearsal. This step does not approve Firestore writes. This step does not approve deploy. This step does not move any real Lindsay, SALTXC, permit, COI, contract, contact, or company data into Sundesk.

## 8. Deploy

Deploy only after explicit deploy approval.

```bash
npm run preflight
firebase deploy --only hosting,firestore:rules,firestore:indexes
```

After deploy:

1. Open the hosted URL.
2. Sign in with an approved Google account.
3. Confirm an unapproved Google account is blocked.
4. Confirm Today remains home.
5. Confirm Build remains visible in the sidebar.
6. Confirm Settings contains the quiet data-boundary note.
7. Create one fake table or fake record only if write approval has been given.
8. Refresh and confirm the fake data state matches the approved write mode.
9. Confirm no real Lindsay or SALTXC data is present.

Firestore writes require separate explicit write approval after the local fake-data backup/import rehearsal. Deploy approval is not write approval. Deploying Hosting and rules is not write approval.

## 9. Install And Bookmark Check

The expected web app path is hosted URL plus mobile Add to Home Screen plus desktop bookmark. Sundesk should show the Sundesk icon on mobile and the Sundesk favicon in desktop bookmarks.

On iPhone:

1. Open the hosted URL in Safari.
2. Use Share.
3. Choose Add to Home Screen.
4. Confirm the name is Sundesk.
5. Confirm the Sundesk icon appears.
6. Open from the home screen.
7. Confirm Google sign-in works.
8. Confirm Today opens first.
9. Confirm Build is reachable from the sidebar.

On Android:

1. Open the hosted URL in Chrome.
2. Use Install app or Add to Home screen.
3. Confirm the name is Sundesk.
4. Confirm the Sundesk icon appears.
5. Open from the launcher.
6. Confirm Google sign-in works.
7. Confirm Today opens first.
8. Confirm Build is reachable from the sidebar.

On desktop:

1. Open the hosted URL in Chrome or Safari.
2. Create a bookmark named Sundesk.
3. Confirm the Sundesk favicon appears.
4. Reopen from the bookmark.
5. Confirm the session persists.
6. Confirm Today opens first.
7. Confirm Build is reachable from the sidebar.

## 10. Backup And Rollback

Before enabling Firestore writes:

- Keep the local browser build as the fallback.
- Complete the local fake-data backup/import rehearsal.
- Use Settings Export backup and Import backup to round-trip a tiny fake dataset locally.
- Export or preserve local fake verification data only if needed for testing.
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
