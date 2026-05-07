# Firebase Setup

V1 uses Firebase Spark only.

Do not enable billing. Do not use Cloud Functions.

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

Create documents in `allowedUsers`:

- `lindsaybelldesign@gmail.com`
- Josh's testing email.

Each document can contain:

```json
{
  "role": "owner",
  "createdAt": "manual"
}
```

## Deploy Later

After setup:

```bash
npm run build
firebase deploy
```

Only deploy after security rules are reviewed.
