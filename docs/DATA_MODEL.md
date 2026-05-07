# Data Model

Firestore is the source of truth.

The Google Sheet is only a digest bridge for Apps Script.

## Core Collections

- `users`
- `tables`
- `records`
- `fields`
- `links`
- `dependencies`
- `views`
- `templates`
- `automations`
- `activityLog`
- `digestSettings`
- `digestQueue`
- `userSettings`

## Record Shape

Each operational item is a record in a table.

Tasks are records in the Tasks table. Communities are records in the Communities table. Custom tables use the same shape.

```json
{
  "id": "task_001",
  "tableId": "tasks",
  "values": {
    "title": "Confirm COI status",
    "status": "blocked",
    "community": ["community_halifax"],
    "dueDate": "2026-05-12",
    "priority": "fire",
    "coiStatus": "missing"
  },
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

## Table Definition Shape

Custom tables are V1.

```json
{
  "id": "tasks",
  "label": "Tasks",
  "description": "Work items Lindsay can create, link, block, and close.",
  "primaryFieldId": "title",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

## Field Definition Shape

```json
{
  "id": "coiStatus",
  "tableId": "communities",
  "label": "COI status",
  "type": "singleSelect",
  "options": ["Missing", "Requested", "Received", "Not needed"],
  "required": false,
  "createdAt": "timestamp"
}
```

## Linked Record Field Shape

Linked records are field values.

```json
{
  "id": "community",
  "tableId": "tasks",
  "label": "Community",
  "type": "linkedRecord",
  "linkedTableId": "communities",
  "allowMultiple": false,
  "createdAt": "timestamp"
}
```

The record stores linked record IDs in the field value.

```json
{
  "id": "task_001",
  "tableId": "tasks",
  "values": {
    "title": "Confirm COI status",
    "community": ["community_halifax"]
  }
}
```

Backlinks are derived from linked-record fields. They are not manually duplicated.

## Link Shape

Links can be materialized when the UI or automations need fast graph reads.

```json
{
  "id": "link_001",
  "fromTableId": "tasks",
  "fromRecordId": "task_001",
  "fromFieldId": "community",
  "toTableId": "communities",
  "toRecordId": "community_halifax",
  "createdAt": "timestamp"
}
```

## Lookup Field Shape

```json
{
  "id": "communityEventDate",
  "tableId": "tasks",
  "label": "Community event date",
  "type": "lookup",
  "sourceLinkedFieldId": "community",
  "sourceFieldId": "eventDate",
  "createdAt": "timestamp"
}
```

## Rollup Field Shape

```json
{
  "id": "openTaskCount",
  "tableId": "communities",
  "label": "Open task count",
  "type": "rollup",
  "sourceLinkedFieldId": "tasks",
  "sourceFieldId": "status",
  "operation": "countWhere",
  "condition": "status is not done",
  "createdAt": "timestamp"
}
```

## Count Field Shape

```json
{
  "id": "followupCount",
  "tableId": "communities",
  "label": "Follow-ups",
  "type": "count",
  "sourceLinkedFieldId": "followups",
  "createdAt": "timestamp"
}
```

## V1 Field Types

- Text.
- Long text.
- Status.
- Single select.
- Multi select.
- Date.
- Date + time.
- Checkbox.
- Number.
- Percent.
- Rating.
- Phone.
- URL.
- Linked record.
- Lookup.
- Rollup.
- Count.
- System formula.
- Created time.
- Last updated time.

## V1 Views

- Today.
- Communities.
- Tasks.
- Grid.
- Kanban.
- Calendar.
- Gantt.
- Follow-ups.
- Approvals.
- Meeting prep.
- At risk.
- Build.
- Settings.

## Priority Reasoning

Sundesk surfaces work using explicit reasons:

- Due today.
- Overdue.
- Blocks another record.
- Blocked by another record.
- Event date is near.
- Follow-up waiting too long.
- Meeting is tomorrow.
- Status changed since yesterday.

The UI must show the reason trail.

## Task Links And Dependencies

Dependencies are typed links between records. Tasks can use them. Other tables can use them too.

```json
{
  "id": "dependency_001",
  "fromTableId": "tasks",
  "fromRecordId": "task_001",
  "toTableId": "approvals",
  "toRecordId": "approval_001",
  "relationship": "dependsOn",
  "reason": "COI must be received before venue readiness can be marked ready.",
  "createdAt": "timestamp"
}
```

Dependency links feed Today, Kanban, Gantt, meeting prep, record drawers, automations, and the daily digest.

## Universal Record Picker

The app needs one record picker that can select from any table.

It is used by:

- Linked-record fields.
- Dependency fields.
- Automation builders.
- View filters.
- Record drawers.

The picker should show table, record title, key status, and safe context.
