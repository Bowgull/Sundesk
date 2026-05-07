# Digest Bridge

The digest bridge is the only Google Sheet in V1.

It is not the app database.

It exists so Apps Script can send the daily digest without paid Firebase services.

## Required Tabs

Create these tabs:

- `DigestQueue`
- `DigestSettings`
- `DigestLog`

## DigestQueue Columns

| sendDate | recipient | priority | title | community | reason | status | dueDate | recordId | sent |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-05-12 | lindsaybelldesign@gmail.com | Fire | Confirm COI status | Halifax | COI blocks venue readiness | Blocked | 2026-05-12 | task-coi-halifax | FALSE |

## DigestSettings Columns

| key | value |
| --- | --- |
| recipient | lindsaybelldesign@gmail.com |
| enabled | TRUE |
| sendTime | 07:30 |
| timezone | America/Toronto |

## DigestLog Columns

| sentAt | recipient | itemCount | status | error |
| --- | --- | --- | --- | --- |

## Setup

1. Create a blank Google Sheet.
2. Add the 3 tabs above.
3. Open Extensions, Apps Script.
4. Paste `apps-script/digest-bridge/Code.gs`.
5. Paste the manifest from `apps-script/digest-bridge/appsscript.json`.
6. Add a time-driven trigger for `sendDailyDigest`.

## Privacy

Only digest metadata belongs here.

No files. No document contents. No imports.
