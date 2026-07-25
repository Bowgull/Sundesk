# Firestore Persistence Plan

Status: plan plus local read-shadow gate.

No Firestore writes are implemented here. The local browser build remains the working product until write approval is explicit.

The current app has a read-shadow loader for remote collection counts. It reports whether read shadow is off, missing config, loading, loaded, or failed. It does not replace local state.

## Goal

Persist the same product shape already running locally:

- Tables.
- Fields.
- Records.
- Linked record values.
- Backlinks derived from linked values.
- Dependencies.
- Rules.
- Build views.
- Theme and digest settings.
- Activity receipts.

Computed surfaces stay computed:

- Today lanes.
- Meeting prep.
- Generated agenda.
- Digest preview.
- Lookups, rollups, counts, and system formula fields.

The database stores source records and user configuration. The app derives the rest.

## Write Gate

Firestore writes stay behind a write intent flag and a separate approval record.

Required before any write path ships:

- `VITE_SUNDESK_FIRESTORE_WRITES=enabled`.
- `VITE_SUNDESK_FIRESTORE_WRITE_APPROVAL=approved`.
- Authenticated allowlisted user.
- Settings screen shows Firestore writes enabled after both values are present.
- Tests cover disabled writes, failed writes, and local fallback.

Default state:

- Reads may be planned.
- Writes are off.
- Local storage remains the active source.
- No background sync.
- No silent migration.

## Collection Shape

Use one user-scoped root:

```txt
users/{userId}
users/{userId}/tables/{tableId}
users/{userId}/fields/{tableId}_{fieldId}
users/{userId}/records/{recordId}
users/{userId}/dependencies/{dependencyId}
users/{userId}/rules/{ruleId}
users/{userId}/views/{viewId}
users/{userId}/settings/{settingsId}
users/{userId}/activityLog/{activityId}
```

The root keeps Sundesk single-user first. Multi-user work can come later without changing record semantics.

## Documents

### Table

```json
{
  "id": "tasks",
  "label": "Tasks",
  "description": "Work items.",
  "primaryFieldId": "title",
  "order": 20,
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

### Field

```json
{
  "id": "status",
  "tableId": "tasks",
  "label": "Status",
  "type": "status",
  "options": ["Blocked", "Waiting", "In progress", "Done"],
  "linkedTableId": null,
  "allowMultiple": true,
  "sourceLinkedFieldId": null,
  "sourceFieldId": null,
  "operation": null,
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

### Record

```json
{
  "id": "task_coi_halifax",
  "tableId": "tasks",
  "values": {
    "title": "Confirm COI status",
    "status": "Blocked",
    "community": ["community_halifax"],
    "dueDate": "2026-05-12"
  },
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

Linked records stay inside `values`. Backlinks are read-time derivations.

### Dependency

```json
{
  "id": "task_coi_halifax_dependsOn_approval_coi_halifax",
  "fromRecordId": "task_coi_halifax",
  "toRecordId": "approval_coi_halifax",
  "relationship": "dependsOn",
  "reason": "Waiting on source approval.",
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

### Rule

```json
{
  "id": "rule_blocked_tasks_today",
  "tableId": "tasks",
  "fieldId": "status",
  "operator": "is",
  "value": "Blocked",
  "action": "showInScreen",
  "destination": "today",
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

Rules remain read models. They do not mutate records in V1.

### Build View

```json
{
  "id": "permit_watch",
  "tableId": "approvals",
  "name": "Permit watch",
  "visibleFieldIds": ["title", "status", "community", "dueDate"],
  "filter": "permit",
  "sortFieldId": "dueDate",
  "sortDirection": "asc",
  "groupFieldId": "status",
  "colorFieldId": "status",
  "density": "comfortable",
  "pinned": true,
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

### Settings

Use named documents:

```txt
settings/theme
settings/digest
settings/buildViewState
```

Theme and digest settings can mirror local state after the write gate opens.

## Read Order

Phase 1. Local only.

- Current state.
- Local storage is source.
- Firestore code stays unused.

Phase 2. Read shadow.

- Show Firestore read-shadow status in Settings.
- Read Firestore collection counts into memory behind a feature flag.
- Compare Firestore payload with local state.
- Do not write.

Phase 3. Manual export.

- User clicks one explicit action to export local state to a JSON file.
- No Firestore write yet.
- This gives a rollback receipt.

Phase 4. Manual first write.

- User clicks one explicit action.
- App writes tables, fields, records, dependencies, rules, views, and settings.
- Activity log records the migration.
- Local storage remains intact.

Phase 5. Firestore active.

- Firestore becomes source for signed-in sessions.
- Local storage becomes cache and offline fallback.
- Writes stay user-initiated until autosave is reviewed.

## Failure Rules

- If Firestore read fails, keep local state and show the error in Settings.
- If Firestore write fails, keep local state and show which document failed.
- Never clear local storage after a failed write.
- Never overwrite Firestore from stale local state without a visible conflict step.
- Never write file contents, permit contents, COI files, contract text, private contact data, or imported company data into build notes.

## Security Rules Target

Start single-user:

```txt
users/{userId}/** readable and writable only by request.auth.uid == userId
```

Add allowlist before write activation.

No public writes.

## Tests Before Writes

- Disabled write gate blocks every write helper.
- Local storage state still loads with no Firebase config.
- Firestore read failure leaves the UI usable.
- Manual migration creates the expected document set.
- Repeated migration does not duplicate records.
- Linked records, backlinks, lookups, rollups, counts, Rules, and meeting prep still derive from source records.

## Open Decisions

- Whether record IDs remain user-readable slugs or move to generated IDs.
- Whether activity log stores every field edit or only major actions.
- Whether autosave belongs in V1.
- Whether digest queue lives in Firestore or stays in the Apps Script bridge for V1.

## Stance

Firestore should persist the engine, not replace it.

The app should still explain why each thing appears.
