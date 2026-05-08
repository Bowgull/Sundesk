# Sundesk Build Instructions

## Operating Rules

- Do not do anything external without approval.
- Local-only build is okay unless explicitly told otherwise.
- No Firebase writes.
- No commit or push unless approved.
- Build stays Build.
- Build is visible in the sidebar.
- Today remains home.
- GitHub repo can stay public, but do not push unless approved.
- Airtable is the logic baseline: tables, records, fields, linked records, backlinks, lookups, rollups, counts, views, automations, and interfaces on top.
- Sundesk should feel simpler than Airtable in daily use.

## Obsidian Build Memory

Always write a CereBro/Obsidian session note at the session boundary.

Obsidian is build memory only. Do not write Lindsay data, SALTXC data, real records, files, document contents, private contact data, permit contents, COI files, contract text, or imported company data.

Use this location:

`/Users/lindsaybell/Library/CloudStorage/GoogleDrive-bocas.joshua@gmail.com/My Drive/CereBro-Vault/07_Knowledge/obsidian-vault/Sundesk/Build History/snapshots`

Use this filename pattern:

`YYYY-MM-DD HHMM Sundesk Session Handoff - Topic.md`

Every Sundesk handoff note must start with this frontmatter shape:

```yaml
---
project: Sundesk
type: build-session-handoff
date: YYYY-MM-DD
time: "HHMM"
status: local-only
tags:
  - sundesk
  - sundesk/build-memory
  - sundesk/session-handoff
---
```

After writing a Sundesk handoff note:

- Link it in `/Users/lindsaybell/Library/CloudStorage/GoogleDrive-bocas.joshua@gmail.com/My Drive/CereBro-Vault/07_Knowledge/obsidian-vault/Sundesk/Build History/Sundesk Build History.md`.
- Do not link it from the CereBro session history.
- Do not use shared tags like `build-memory` or `session-handoff`.
- Do not leave Sundesk notes in the CereBro folder.
