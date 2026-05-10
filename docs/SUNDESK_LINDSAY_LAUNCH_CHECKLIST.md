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

## Onboarding, Sundesk Lab, And Copy Modes

Sundesk must include a Lindsay-ready education path before handoff.

Required:

- First-run choice: `Walk me through it` and `I'll poke around`.
- A soft guided tour that teaches Today, Build, table, record, field, linked record, view, meeting PDF export, and Sundesk Lab.
- One guided onboarding flow with explanation steps and action steps.
- Exact target-click advancement for highlighted onboarding targets.
- Settings action to restart onboarding without deleting data.
- Sundesk Lab sandbox with fake GTA-style data.
- Sundesk Lab module progress with Continue and Start over.
- Sample workspace reset that does not touch Lindsay's real workspace.
- Local Help search and troubleshooting cards.
- Meeting note export as PDF only.
- No Markdown surfaced to Lindsay.
- No AI calls.
- Field type surface explanation inside onboarding.
- Custom multi-tag creation and reuse.
- Tags surfaced in Today as route chips where useful.
- Checkbox swatches with no colour names in the UI.
- Checkbox flag icon render QA.
- RuPaul Mode as a system-wide copy toggle in Settings.
- RuPaul Mode preference synced across desktop and mobile once shared settings are active.
- Plain-copy reveal after 500ms hover on desktop or long press on mobile.
- iPhone PWA pass for onboarding, Sundesk Lab, Help, RuPaul Mode, and meeting PDF export.

Exact implementation spec: `docs/SUNDESK_BUILD_READY_IMPLEMENTATION_SPEC.md`.

Meeting PDF onboarding copy must include:

`Export your meeting note PDF, and remember to send Josh your template to fine tune this better for you my pookie`

All of this must sync across desktop and mobile for the final app. Local-only state is acceptable during local build only.

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
VITE_SUNDESK_FIRESTORE_WRITE_APPROVAL=approved
```

Leave both blank for local verification without remote writes.

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
7. Confirm the fake data proves hierarchy: Today first read, Build grid, record drawer, linked rows, and saved views.
8. Confirm visible focus states work through sidebar, Today controls, Build grid, menus, modals, and drawer.
9. Confirm keyboard access covers Tab, Shift Tab, Enter, Escape, arrow-key grid movement, and icon-only button labels.
10. Refresh.
11. Confirm local state remains usable.
12. Open Settings.
13. Confirm the quiet data-boundary note is there.
14. Confirm Settings shows the actual Export backup and Import backup controls.
15. Confirm the Settings Launch readiness panel is visible.
16. Confirm Settings shows the install/bookmark path.
17. Confirm Firestore writes are shown as disabled unless approval has been given.
18. Open Today and click Preview summary.
19. Confirm the command-send preview says no send happened.
20. Confirm the preview includes Now, Waiting, Next, and meeting prep context.
21. Open Build and choose a table or saved view with visible rows.
22. Use Export CSV only as a local browser download for that current visible table or view.
23. Confirm the CSV has headers and at least one visible row from the selected table.
24. Confirm this export does not change Firebase setup, does not sync remotely, and does not write remote data.
25. Run first-run onboarding with fake data.
26. Confirm onboarding teaches tables once at a surface level.
27. Confirm onboarding advances only from exact highlighted target clicks or exact expected actions.
28. Confirm Restart onboarding does not erase workspace data.
29. Create multiple custom tags on one fake record.
30. Confirm a useful tag appears as a Today route chip and opens Build filtered to that tag.
31. Confirm checkbox flag icon and swatches render correctly without colour names in the UI.
32. Open Sundesk Lab.
33. Confirm Lab progress can Continue and Start over.
34. Confirm sample data is separate from real workspace data.
35. Export a meeting note PDF.
36. Confirm no Markdown is exposed.
37. Turn on RuPaul Mode.
38. Confirm core app copy changes system-wide.
39. Confirm 500ms hover or long press reveals plain copy.
40. Confirm critical actions stay understandable.
41. Confirm onboarding, Lab progress, custom tag options, and RuPaul Mode sync across desktop and mobile only after Firestore writes have been explicitly approved.

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
16. Use Build Export CSV on the current visible fake table or view and confirm the downloaded file has headers and visible fake rows only.
17. Treat Build Export CSV as local browser output only. It is not a backup, not remote sync, and not Firebase write approval.

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
7. Confirm fake-data hierarchy, focus states, keyboard access, mobile navigation, and icon labels still match the local QA baseline.
8. Create one fake table or fake record only if write approval has been given.
9. Refresh and confirm the fake data state matches the approved write mode.
10. Confirm no real Lindsay or SALTXC data is present.

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
