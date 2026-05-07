# Data Model

Firestore is the source of truth.

The Google Sheet is only a digest bridge for Apps Script.

## Core Collections

- `users`
- `tables`
- `communities`
- `tasks`
- `followUps`
- `approvals`
- `meetings`
- `meetingItems`
- `risks`
- `people`
- `fields`
- `views`
- `templates`
- `automations`
- `activityLog`
- `digestSettings`
- `digestQueue`
- `userSettings`

## Record Shape

Each operational record has fixed fields and custom fields.

```json
{
  "id": "task_001",
  "type": "task",
  "title": "Confirm COI status",
  "status": "blocked",
  "communityId": "community_halifax",
  "dueDate": "2026-05-12",
  "priority": "fire",
  "custom": {
    "coiStatus": "missing"
  },
  "linkedRecordIds": ["approval_001", "followup_001"],
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
  "table": "communities",
  "label": "COI status",
  "type": "singleSelect",
  "options": ["Missing", "Requested", "Received", "Not needed"],
  "required": false,
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

Tasks can link to records in any V1 table.

```json
{
  "id": "dependency_001",
  "fromRecordId": "task_001",
  "toRecordId": "approval_001",
  "relationship": "dependsOn",
  "reason": "COI must be received before venue readiness can be marked ready.",
  "createdAt": "timestamp"
}
```

Dependency links feed Today, Kanban, Gantt, meeting prep, and the daily digest.
