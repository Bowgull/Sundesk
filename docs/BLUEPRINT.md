# Sundesk Blueprint

Sundesk is a private operations workbase for Lindsay Bell at SALTXC.

It borrows Airtable's useful logic: tables, records, typed fields, linked records, backlinks, lookups, rollups, counts, saved views, visual modes, templates, interfaces, and automations. It does not ask Lindsay to live inside a database. The daily surface is a cockpit that shows what matters, why it matters, and what to do next.

## Product Stance

Sundesk is not a generic task manager.

It is:

- Airtable primitives underneath.
- Guided cockpit on top.
- Manual metadata entry.
- Custom tables in V1.
- Universal records.
- Task creation in V1 as one table, not the whole app.
- Dependencies in V1 as typed links between records.
- Linked records across every table.
- Backlinks.
- Lookups.
- Rollups.
- Counts.
- Saved views.
- Custom automations.
- Daily digest.
- Privacy first by default.

## Product Architecture

The current product plan lives in [Product Architecture Plan](PRODUCT_ARCHITECTURE_PLAN.md).

Sundesk is a hybrid:

- Airtable underneath.
- Notion in record focus.
- Baserow in grid discipline.
- SmartSuite in linked-record display.
- Monday only where visual status helps.
- Sundesk on top for Today, Communities, meeting prep, and open loops.

The core engines are schema, records, fields, relationships, views, interfaces, and rules.

The power belongs in Build. The calm belongs in Today.

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
- New task path.
- Dependency state.

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
- Linked record fields.
- Lookup fields.
- Rollup fields.
- Count fields.
- Views.
- Templates.
- Automations.
- Export.

Lindsay can customize the system without being forced to manage the system every day.

Build stays visible in the sidebar. It is not renamed.

Build is not developer mode. It is the user-editable workshop.

Build opens to Communities.

The main Build surface is the grid. Table creation, field creation, field settings, and record creation should live in menus or modals, not always-visible panels.

Views such as Kanban, calendar, and Gantt belong to the View Engine. They can be pinned to the left nav when useful. They should not become permanent nav clutter by default.

## Airtable Logic Baseline

Airtable is the baseline for Sundesk's logic model.

Not the visual clone. Not the pricing model. Not the daily complexity.

The baseline is:

- Every table has fields.
- Every table has records.
- Any table can link to another table.
- Linked records are field values.
- Backlinks are visible automatically.
- Lookups pull values from linked records.
- Rollups summarize linked records.
- Counts count linked records.
- Views sit on top of fields and linked records.
- Automations can read fields, linked records, views, and record changes.
- Interfaces sit on top for daily work.

Sundesk should feel simpler than Airtable in daily use. The connected-base logic underneath must be real.

## Connection Model

Every V1 table gets the same connection powers.

- Communities can link to Tasks, Meetings, People, Risks, Approvals, Follow-ups, and custom tables.
- Tasks can link to Communities, Approvals, Follow-ups, Meetings, People, Risks, other Tasks, and custom tables.
- Approvals can link to Communities, Tasks, People, Risks, and custom tables.
- Follow-ups can link to People, Communities, Tasks, Approvals, Meetings, and custom tables.
- Meetings can link to Communities, Tasks, Risks, People, Follow-ups, and custom tables.
- People can link to Communities, Tasks, Follow-ups, Approvals, Meetings, and custom tables.
- Risks can link to Communities, Tasks, Approvals, Meetings, People, and custom tables.
- Custom tables can link to any table.

No table gets special connection logic unless the user-facing workflow needs it.

## Settings UX

Settings owns personal configuration.

It includes:

- Appearance.
- Daily digest.
- Privacy.
- Account.
- Run setup again.

Daily digest settings include on/off, recipient email, send time, timezone, included items, preview digest, and send test digest.

Run setup again reviews privacy, theme, digest, starter tables, and first communities. No data is deleted.

## Tasks

Tasks are first-class records.

Lindsay can create a task, link it to a community, set status, set due date, add priority, link records, and mark dependencies.

Tasks are not the center of the product. They are one table inside the connected base.

Examples:

1. Confirm COI status depends on venue readiness.
2. Permit follow-up blocks site map review.
3. Meeting prep reads open tasks, risks, and follow-ups.

Tasks can appear in Today, grid, Kanban, calendar, Gantt, meeting prep, follow-ups, approvals, at-risk views, and custom saved views.

## Record Drawers

Every record drawer shows the graph around that record:

- Fields.
- Linked records.
- Backlinks.
- Dependencies.
- Lookups.
- Rollups.
- Counts.
- Activity.
- Why it surfaced.

Halifax is one Community record. It is not hard-coded product logic.

## Today Logic

Today is computed from the connected base.

Inputs include:

- Due dates.
- Status.
- Priority.
- Linked records.
- Backlinks.
- Dependencies.
- Missing approvals.
- Overdue follow-ups.
- Upcoming meetings.
- At-risk communities.
- Saved views.
- Automation rules.

Today is not a hand-authored dashboard. It is an interface over the base.

## Themes

V1 themes:

- Sunrise Soft.
- Sunset Bold.
- Cloud Light.
- Focus Dark.
- Light.

Sunrise Soft is the default.

The logo defines the visual source of truth: navy wordmark, sunrise grid, coral, peach, gold, cloud blue, and lavender table geometry.

## Build Memory

Obsidian is for build memory only.

At the end of each build session, write one manual note that records:

- What changed.
- What was tested.
- What is still open.
- Decisions made.
- Next session scope.

This is for Cerebro's thinking. It is not a Sundesk feature.

Stop writing these notes when the build is complete.

Never export Lindsay data, SALTXC data, private records, files, document contents, private numbers, permit content, COI files, contracts, or imported company data into Obsidian.

Bridgefour visibility is out of scope for this build plan.

## Final Polish

The final build session is UI and UX polish.

It should review the whole app as a product Lindsay can use:

- First screen clarity.
- Today action flow.
- Build power without daily noise.
- Record drawer readability.
- Mobile layout.
- Theme fit.
- Empty states.
- Button labels.
- Privacy copy.
- No fake dead ends.
