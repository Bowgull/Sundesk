# Lindsay Web App Deploy Readiness

Status: shared web app direction approved. Implementation in progress.

Sundesk is a Vite React app. The near-term path is a real hosted web app for Josh and Lindsay.

No deploy has run in this step. No Firebase writes. No remote data changes.

Use [Sundesk Lindsay Launch Checklist](./SUNDESK_LINDSAY_LAUNCH_CHECKLIST.md) for the remaining setup path.

## Recommended Path

Use Firebase Hosting, Firebase Auth, and Firestore for the first Lindsay web app.

Reason:

- The repo already has `firebase.json`.
- Hosting serves `dist`.
- SPA rewrites already point to `index.html`.
- Firebase Auth gives Google sign-in with browser session persistence.
- Firestore gives the shared cross-device workspace Lindsay needs.
- No server runtime is needed for the first hosted app.

The deploy path, after explicit approval:

```bash
npm run build
firebase deploy --only hosting,firestore:rules,firestore:indexes
```

Use one Firebase project. Keep billing off. Do not enable Cloud Functions, Cloud Storage, App Hosting, Extensions, imports, or file upload.

For Josh and Lindsay use, the first deploy should stay simple:

- Static app hosted from `dist`.
- Google sign-in with local browser persistence.
- Approved-user allowlist for Josh and Lindsay.
- Firestore workspace document at `workspaces/lindsay-sundesk/state/current`.
- Browser-local storage remains a fallback and cache only.
- No broad team permissions.
- No file storage.
- No document imports.

Before any public URL is shared, confirm the app has no real SALTXC records, document contents, private contact data, permit contents, COI contents, or contract text baked into source, demo data, screenshots, or local export files.

## Persistence Caveats

Current runtime persistence is local browser storage when Firebase is not configured.

When Firebase config and approved Google access are present, `App` now:

- Shows the Google auth gate.
- Subscribes to Firebase Auth.
- Loads `workspaces/lindsay-sundesk/state/current` after an approved sign-in.
- Applies the shared workspace to the local app state.
- Saves shared workspace snapshots only when `VITE_SUNDESK_FIRESTORE_WRITES=enabled`.

Observed local keys include:

- Workbase state.
- Build view state.
- Rules.
- Theme.

This is enough for local validation only.

It has limits:

- Data is tied to the browser and device.
- Clearing site data can remove the workbase.
- Incognito and profile switches can look empty.
- There is no cross-device sync.
- There is no team backup.
- A hosted static app does not make local state portable by itself.

For daily use, the Firebase project, allowlist, and deploy still need to be set up before Lindsay relies on Sundesk across browser, mobile, and another device.

## Firebase Boundary

Firebase files exist.

Current deploy readiness should treat Firebase as Hosting, Google Auth, Firestore rules, and one approved workspace path.

Do not turn on Firestore writes without a separate deploy/setup approval and review. The shared workspace helpers keep writes behind an explicit gate.

Firestore workspace snapshot helpers are wired into runtime, but writes remain disabled unless the explicit environment gate is enabled.

The intended shared workspace path is:

- `workspaces/lindsay-sundesk`
- `workspaces/lindsay-sundesk/state/current`
- subcollections under `workspaces/lindsay-sundesk`

Firestore rules allow:

- `allowedUsers/{email}`: signed-in users can read only their own allowlist document.
- `allowedUsers/{email}`: no client writes.
- `workspaces/lindsay-sundesk`: signed-in allowlisted users can read and write.
- `workspaces/lindsay-sundesk/{document=**}`: signed-in allowlisted users can read and write subcollection documents.
- every other document: denied.

Add Josh and Lindsay manually in Firebase Console by creating `allowedUsers` documents whose document IDs are their approved Google email addresses. Do not commit those addresses, `.env.local`, exported Firestore data, service account keys, or setup screenshots containing private values.

The quiet user-facing disclaimer belongs in Settings, not in the first-run path.

## Not Included

This readiness path does not include:

- Firebase deployment.
- Firebase write activation in production.
- Boss or broader team account management.
- File uploads.
- Document imports.
- Google Drive sync.
- Gmail scraping.
- CSV import.
- Cloud Functions.
- Scheduled jobs.
- Paid Firebase services.
- Backups beyond local browser data.

## Verification Commands

Run before any approved deploy:

```bash
npm run lint
npm run test
npm run build
npm run preview
```

Then smoke test the preview URL:

- Open Today.
- Open Build from the sidebar.
- Create a test table or record with fake data only.
- Refresh the browser.
- Confirm the test data remains.
- Change theme.
- Refresh again.
- Confirm the theme remains.
- Open Settings.
- Confirm the data boundary note is present.
- Confirm the app icon appears for browser bookmark and Add to Home Screen.

If E2E is expected for the release check:

```bash
npm run test:e2e
```

## EOD Readiness Checklist

- `npm run lint` passes.
- `npm run test` passes.
- `npm run build` passes.
- Preview smoke test passes.
- Build remains visible in the sidebar.
- Today remains home.
- No real Lindsay or SALTXC data is committed.
- No Firebase writes are enabled before deploy approval.
- No Firebase deploy has run without explicit approval.
- Google login is wired with browser session persistence.
- Firestore workspace save and hydrate are wired.
- Firestore rules limit access to approved users.
- Mobile Add to Home Screen uses the Sundesk icon.

Static hosting alone is not enough for the requested Lindsay web app. The finished first version needs Hosting, Google Auth, and Firestore.
