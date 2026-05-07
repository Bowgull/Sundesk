# Sundesk Blueprint

Sundesk is a private operations workbase for Lindsay Bell at SALTXC.

It borrows Airtable's useful primitives: typed fields, linked records, saved views, record drawers, visual modes, templates, and automations. It does not ask Lindsay to live inside a database. The daily surface is a cockpit that shows what matters, why it matters, and what to do next.

## Product Stance

Sundesk is not a generic task manager.

It is:

- Airtable primitives underneath.
- Guided cockpit on top.
- Manual metadata entry.
- Linked records.
- Saved views.
- Custom automations.
- Daily digest.
- Privacy first by default.

## V1 Rule

Track operational status. Not files.

No document uploads. No pasted document contents. No imports. Phone numbers and sensitive contact details only when permitted.

## V1 Stack

- React + Vite.
- TypeScript.
- Firebase Hosting on Spark.
- Firebase Auth on Spark.
- Firestore on Spark.
- Google Apps Script for the daily digest.
- Google Sheet as a digest bridge only.

No Cloud Functions in V1. No paid services.

## Daily UX

The default screen is Today.

It shows:

- Priority queue.
- Why each item surfaced.
- Blocked dependencies.
- At-risk communities.
- Overdue follow-ups.
- Next meeting prep.
- Daily digest preview.

The system must show its work.

Example:

1. COI status is missing.
2. COI blocks venue readiness.
3. Event is within 7 days.
4. Follow-up is overdue.

## Build UX

Build mode is separate from daily work.

It includes:

- Tables.
- Fields.
- Views.
- Templates.
- Automations.
- Export.
- Theme settings.
- Privacy settings.
- Digest settings.

Lindsay can customize the system without being forced to manage the system every day.

## Themes

V1 themes:

- Sunrise Soft.
- Sunset Bold.
- Cloud Light.
- Focus Dark.
- Light.

Sunrise Soft is the default.

The logo defines the visual source of truth: navy wordmark, sunrise grid, coral, peach, gold, cloud blue, and lavender table geometry.
