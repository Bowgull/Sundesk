# Firebase Setup

V1 uses Firebase Spark only.

Do not enable billing. Do not use Cloud Functions.

No deploy has run from this task. Deploy approval and write approval are separate. No Firebase writes should run without explicit write approval.

Use [Sundesk Lindsay Launch Checklist](./SUNDESK_LINDSAY_LAUNCH_CHECKLIST.md) as the final setup order.

## Create Project

1. Open Firebase Console.
2. Create a project named `sundesk`.
3. Keep billing off.
4. Add a web app.
5. Copy the Firebase web config into `.env.local`.

Use `.env.example` as the template.

## Enable Products

Enable:

- Firebase Hosting.
- Firebase Authentication.
- Firestore.

Do not enable:

- Cloud Functions.
- Cloud Storage.
- App Hosting.
- Extensions.

## Auth

Enable Google sign-in.

## Firestore Allowlist

Firestore access is gated by `allowedUsers`.

Create one document per approved Google account:

1. Open Firebase Console.
2. Open Firestore Database.
3. Create the collection `allowedUsers`.
4. Create a document whose document ID is the approved Google email address.
5. Add only non-secret metadata fields.

Each document can contain:

```json
{
  "role": "owner",
  "createdAt": "manual"
}
```

Add Josh and Lindsay in the Firebase Console. Do not commit their email addresses, screenshots, exported records, service account keys, or `.env.local`.

Client code cannot create or edit `allowedUsers`. Rules allow a signed-in user to read only their own allowlist document. All client writes to `allowedUsers` are denied.

## Firestore Workspace Path

The first shared workspace is fixed:

- `workspaces/lindsay-sundesk`
- `workspaces/lindsay-sundesk/state/current`
- subcollections under `workspaces/lindsay-sundesk`

Only signed-in users with a matching `allowedUsers/{email}` document can read or write that workspace tree.

All other Firestore documents are denied.

## Deploy Later

Before any approved deploy, run the expected launch verification:

```bash
npm run verify:launch
```

After explicit deploy approval:

```bash
npm run verify:launch
firebase deploy --only hosting,firestore:rules,firestore:indexes
```

Hosted smoke test order:

1. Open the hosted URL.
2. Sign in with an approved Google account.
3. Confirm an unapproved Google account is blocked.
4. Confirm Today opens first.
5. Confirm Build is visible in the sidebar.
6. Open Settings and confirm the quiet data-boundary note.
7. Use fake data only. Create a fake record only after write approval.
8. Refresh and confirm the state matches the approved write mode.

Only deploy after security rules are reviewed. Deploy approval is not Firestore write approval. Keep billing off. Keep Cloud Functions off. Keep private emails, real records, SALTXC data, permit contents, COI contents, and contract text out of docs and screenshots.
