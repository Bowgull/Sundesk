# Sundesk Product Architecture Plan

Sundesk is a private operations workbase.

It should feel calm in daily use and fully editable in Build.

The daily user should not need to understand schema mechanics. The Build user should be able to shape the system without code.

## Product Boundary

Today is home.

Build is the workshop.

Today shows what needs attention. Build edits the structure that makes Today possible.

Build is important because tables are the core product logic.

Every daily surface depends on tables:

- Today reads records, fields, links, dates, status, priority, and rules.
- Communities reads the Communities table and every record linked to it.
- Meeting prep reads Meetings, Tasks, Follow-ups, Risks, and Approvals.
- Rules read field changes and route records into the right lane.
- Views decide how records are scanned, grouped, filtered, and saved.

The interface can feel simple only if the table engine underneath is real.

This boundary is mandatory:

- Today has no table setup controls.
- Today has no field setup language.
- Today has no schema decisions.
- Build owns tables, fields, views, links, rules, and templates.
- Build is still for normal users. It is not developer mode.

## Competitive Model

Sundesk is a hybrid, not a clone.

- Airtable underneath: tables, records, fields, views, linked records, lookups, rollups, counts, rules, and interfaces.
- Notion in record focus: a record opens into a readable modal with fields, related items, and notes.
- Baserow in grid discipline: fields behave consistently, views are reliable, widths and visibility are saved by view.
- SmartSuite in linked-record display: related work can show compact, expanded, or grid-like later.
- Monday only where it helps visual clarity: lanes, status colour, and quick scanning.
- Sundesk on top: Today, Communities, meeting prep, and open loops shaped for event coordination.

From the user perspective, the reference products do not feel like one long page.

- Airtable feels like a base with tables and views inside each table.
- Notion feels like pages, databases, linked database views, and records that open as pages.
- SmartSuite feels like solutions, tables, records, saved views, and clear relationship surfaces.
- Monday feels like workspaces, boards, groups, items, columns, and board views.

Sundesk should learn from that shape.

Main sidebar items are app screens:

- Today.
- Communities.
- Tasks.
- Follow-ups.
- Meetings.
- Timeline.
- Build.
- Settings.

They are not anchors inside one scrolling document.

Each screen has one job. Each screen may contain tabs, views, modals, or drawers inside it. Build has table tabs. A table has saved views. A record has a modal. Those are nested surfaces, not new top-level app screens by default.

The hybrid rule:

- Airtable owns the database logic.
- Notion owns the readable record moment.
- SmartSuite owns relationship clarity.
- Monday owns scan speed.
- Sundesk decides what matters today.

This means Build must feel like a table workshop, not a developer console. It should expose enough power to shape the system without making daily work feel like database maintenance.

## Core Engines

Sundesk needs 7 engines to function like real software.

### 1. Schema Engine

- Tables.
- Fields.
- Field settings.
- Name fields.
- Field type changes.
- Safe delete.
- Table rename and delete.
- Schema versioning later.

### 2. Record Engine

- Create records.
- Edit records.
- Delete records.
- Record modal.
- Field validation.
- Default values.
- Empty states.
- Undo later.
- Activity history later.

### 3. Field Engine

- Text.
- Long text.
- Number.
- Price.
- Date.
- Checkbox with editable icon and colour.
- Single select with editable options and colours.
- Tags with editable options and colours.
- Link to another table.
- Lookup.
- Count.
- Rollup.
- Formula later.

### 4. Relationship Engine

- One-to-one.
- One-to-many.
- Many-to-many.
- Backlinks.
- Linked-record picker.
- Linked-record display settings.
- Linked-record filters later.
- Linked-record limits later.

### 5. View Engine

- Grid.
- Hide fields.
- Resize columns.
- Sort.
- Filter.
- Group.
- Saved views.
- Pinned views.
- Kanban.
- Calendar.
- Gantt.
- Personal/system views later.

### 6. Interface Engine

- Today.
- Communities screen.
- Tasks screen.
- Follow-ups screen.
- Meetings screen.
- Timeline screen.
- Meeting prep.
- Build screen.
- Settings screen.
- Record modal.
- Open loops.
- No schema language outside Build.

### 7. Rules Engine

- Plain language rules.
- Shape: `When this happens, do this.`
- Routes records into Today.
- Marks risk.
- Surfaces overdue, blocked, waiting, and upcoming work.
- Later: notifications, email drafts, LLM summaries.

## Full Editability Rule

Nothing meaningful is preset or locked.

Starter tables and starter fields can exist as scaffolding. They are not product truth.

The user can:

- Rename tables.
- Create tables.
- Delete tables.
- Rename fields.
- Create fields.
- Delete fields.
- Change field type.
- Edit dropdown options.
- Edit status options.
- Edit tag options.
- Edit option colours.
- Edit checkbox icons.
- Edit checkbox colours.
- Edit linked-record target table.
- Edit linked-record single or multiple behavior.
- Edit views.
- Edit rules later.

Guardrails:

- A table needs a name field.
- A field needs a type.
- System fields are read-only if added.
- Delete actions require confirmation.
- The name field is protected from deletion.

## Build UX

Build opens to Risks.

Communities already has a sidebar surface. Build should not open by surfacing Communities again.

Default Build table order:

- Risks.
- Tasks.
- Follow-ups.
- Approvals.
- Meetings.
- People.
- Custom tables.

The main Build surface is the grid.

Build is the primary place to see and edit tables.

The table list must remain obvious:

- Tables are visible as tabs.
- The active table is clear.
- The current view belongs to the active table.
- Fields are table structure.
- Records are saved objects.
- Editing a saved record is intentional.
- Creating a table is a visible command.
- Creating a field is a visible command.

Build should contain:

- Table tabs across the top.
- `Add table`.
- `Add field`.
- View bar.
- Grid.
- `Add record` row.
- Static saved records.
- Explicit `Edit` actions.
- Record modal.

Always-visible builder panels should be removed.

Table setup, field setup, and record creation should live in menus or modals.

### Saved State Rule

Saved records render as saved records.

The grid should not look like a form by default.

Default state:

- Cell values are readable.
- Select values render as tags.
- Linked records render as pills.
- Checkboxes render as marks.
- Computed fields render as read-only values.

Edit state:

- Row opens through `Edit`.
- Record modal shows editable fields.
- Field settings open through the column menu.
- Table setup opens through table actions.

This keeps Build powerful without making the app feel unfinished.

### Table Actions

- Add table.
- Rename table.
- Delete table with confirmation.
- Duplicate table later.
- New table starts with one name field.

### Field Actions

Field actions live in the column header menu:

- Rename field.
- Edit field settings.
- Insert field left.
- Insert field right.
- Hide field.
- Delete field.

Delete confirmation:

```text
Delete field.
This removes the field from every record in this table.
This cannot be undone in this local build.
```

Buttons:

- Cancel.
- Delete field.

### Field Settings

Field settings open in a modal.

Settings change by field type.

Checkbox field settings:

- Field name.
- Icon: check, star, heart, thumb, flag.
- Colour: editable palette.

Single select field settings:

- Field name.
- Options.
- Option colours.
- Reorder options later.

Tags field settings:

- Field name.
- Options.
- Option colours.
- Reorder options later.

Linked-record field settings:

- Field name.
- Linked table.
- One item only or multiple items allowed.
- Limit picker to a view later.

## Today UX

Today has 3 lanes:

- Now.
- Waiting.
- Next.

Now:

- Overdue.
- Blocked.
- Due today.
- Event-risk work.
- True fires.

Waiting:

- Someone owes information.
- Approval pending.
- Follow-up unanswered.
- Community update needed.

Next:

- Upcoming deadlines.
- Meeting prep.
- Proactive updates.
- Work that should not become urgent.

Today should show why each item surfaced.

Example reason trail:

1. Due today.
2. Approval missing.
3. Blocks community readiness.

## Communities

Community is the main operating object.

Most operational work can link to a community. Some tasks can stand alone.

Communities should show:

- Status.
- Readiness.
- Open loops.
- Blockers.
- Due dates.
- Follow-ups.
- Approvals.
- Meeting prep.
- Related tasks.

## Views And Navigation

Kanban, calendar, and Gantt belong to the View Engine.

They should not be permanent left-nav clutter by default.

Best model:

- Views live under each table.
- A user can pin important views to the left nav.
- Default pinned views can include Today, Communities, Build, and Settings.
- The user can pin a Kanban, Calendar, Gantt, or saved grid view when it becomes part of regular work.
- Pinned views are for views she needs to check, update, or reference often.
- Examples: `Community Calendar`, `Approvals Kanban`, `Event Timeline`, `Waiting Follow-ups`, `Meeting Prep`.
- Pinned views keep their table context. Opening one should still show which table and view it belongs to.
- Users can unpin views when they stop being active.

This keeps power available without making the daily app feel crowded.

## Meeting Prep

Meeting prep should be generated from structured records first.

No LLM is required for the core.

Inputs:

- Open tasks.
- Blocked items.
- Overdue follow-ups.
- Unresolved approvals.
- Risks.
- Recent notes later.
- Community status.
- Next steps.

LLM hook can come later for:

- Turning bullets into meeting language.
- Summarizing recent movement.
- Drafting follow-up emails.
- Finding missing context.

The app must know what matters before prose generation.

## Rules

Rules should exist in Build.

Do not call them automations in primary UI.

Use plain language:

```text
When this happens, do this.
```

Starter rule types:

- When a record is overdue, show it in Now.
- When a follow-up is waiting, show it in Waiting.
- When a deadline is coming up, show it in Next.
- When an approval is blocked, mark the community at risk.
- When a meeting is within 2 days, prepare the agenda.

Rules are editable.

## Onboarding

Start with sample tables based on the work.

Do not start blank.

Teach by doing:

1. Create a community.
2. Add a task.
3. Link the task.
4. Mark a follow-up waiting.
5. See it land in Today.

Onboarding should make Build understandable without turning it into a tutorial wall.

## Build Sequence

### Current checkpoint

Done locally:

1. Reset Build layout.
2. Implement table tabs and grid-first Build.
3. Move add table, add field, and field settings into modals.
4. Add editable field settings after creation.
5. Add delete confirmations.
6. Add record modal.
7. Make saved Build rows render as static saved values.
8. Rebuild Today as Now, Waiting, Next.
9. Set Build to open on Risks.
10. Remove Communities from the Build tabs.

Next:

1. Add table actions: rename table, delete table, duplicate table later.
2. Replace linked-record editing inside the record modal with a stronger picker.
3. Add real view persistence: visible fields, widths, filter, sort, group.
4. Add pinned views.
5. Add deterministic meeting prep.
6. Add Rules.
7. Add Firestore persistence.
8. Add activity history later.

## Stance

Sundesk should rival the big tools by doing less on the surface and more underneath.

The power belongs in the engine.

The calm belongs in the interface.
