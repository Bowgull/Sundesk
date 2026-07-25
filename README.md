# Sundesk

Private operations workbase for Lindsay Bell at SALTXC.

Sundesk tracks operational metadata, linked records, views, automations, and daily priority logic. It does not store files, document contents, or imported company data.

## V1 Stack

- React + Vite.
- TypeScript.
- Firebase Spark Hosting.
- Firebase Spark Auth.
- Firestore Spark.
- Google Apps Script daily digest bridge.

No paid services. No Cloud Functions. No imports. No uploads.

## Local Development

```bash
npm install
npm run dev
```

## Launch Verification

```bash
npm run verify:launch
```

This runs preflight, lint, unit tests, production build, full smoke, auth gate, and production PWA checks.

## Docs

- [Blueprint](docs/BLUEPRINT.md)
- [Product architecture plan](docs/PRODUCT_ARCHITECTURE_PLAN.md)
- [Privacy](docs/PRIVACY.md)
- [Data model](docs/DATA_MODEL.md)
- [V1 scope](docs/V1_SCOPE.md)
- [UI/UX polish spec](docs/UI_UX_POLISH_SPEC.md)
- [Firebase setup](docs/FIREBASE_SETUP.md)
- [Digest bridge](docs/DIGEST_BRIDGE.md)
- [Theme system](docs/THEME_SYSTEM.md)

## Privacy Boundary

Track status. Not files.

Do not upload files. Do not paste document contents. Enter phone numbers or sensitive contact details only if permitted.
