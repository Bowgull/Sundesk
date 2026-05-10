# Lindsay Web App Deploy Readiness

Status: local-only readiness note.

Sundesk is a Vite React app. The near-term path is a static web app for Lindsay only.

No deploy in this step. No Firebase writes. No config edits.

## Recommended Path

Use Firebase Hosting for the first Lindsay web app.

Reason:

- The repo already has `firebase.json`.
- Hosting serves `dist`.
- SPA rewrites already point to `index.html`.
- No server runtime is needed for the current app.
- Firebase writes can stay off.

The deploy path, after explicit approval:

```bash
npm run build
firebase deploy --only hosting
```

Use one Firebase project. Keep billing off. Do not enable Cloud Functions, Cloud Storage, App Hosting, Extensions, imports, or file upload.

For Lindsay-only use, the first deploy can stay simple:

- Static app hosted from `dist`.
- Browser-local state remains the working state.
- Firestore writes remain disabled.
- Firestore read-shadow remains optional and gated.
- No multi-user account model.
- No team permissions.

Before any public URL is shared, confirm the app has no real SALTXC records, document contents, private contact data, permit contents, COI contents, or contract text baked into source, demo data, screenshots, or local export files.

## Persistence Caveats

Current runtime persistence is local browser storage.

Observed local keys include:

- Workbase state.
- Build view state.
- Rules.
- Theme.

This is enough for Lindsay-only use during early validation.

It has limits:

- Data is tied to the browser and device.
- Clearing site data can remove the workbase.
- Incognito and profile switches can look empty.
- There is no cross-device sync.
- There is no team backup.
- A hosted static app does not make local state portable by itself.

For daily use, keep one primary browser profile. Add manual JSON export before relying on the app for real operations.

## Firebase Boundary

Firebase files exist.

Current deploy readiness should treat Firebase as hosting only.

Do not turn on Firestore writes without a separate approval and review. The existing persistence plan keeps writes behind `VITE_SUNDESK_FIRESTORE_WRITES=enabled`.

Firestore read-shadow can be used later to compare remote collection counts. It does not replace local state.

## Not Included

This readiness path does not include:

- Firebase write activation.
- Firestore migration.
- Account management.
- Multi-user permissions.
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
- Confirm Firestore writes are off.

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
- No Firebase writes are enabled.
- No Firebase deploy has run without explicit approval.
- Local persistence caveats are accepted for this phase.

Static hosting is enough for the first Lindsay-only web app. Persistence is the known risk.
