# Privacy Model

Sundesk is a metadata system.

It does not store documents, document contents, email threads, or imported company data.

## Allowed In V1

- Community names.
- Task titles.
- Statuses.
- Due dates.
- Event dates.
- Owners.
- Short operational notes.
- Follow-up status.
- Approval status.
- Risk level.
- Phone numbers only when permitted.

## Not Allowed In V1

- File uploads.
- Document imports.
- CSV imports.
- Google Drive imports.
- Gmail scraping.
- Full email threads.
- COI files.
- Permit files.
- Site map files.
- Contract contents.
- Pasted confidential document contents.

## Onboarding Warning

The first-run onboarding must state:

> Track status only. Do not upload files. Do not paste document contents. Enter phone numbers or sensitive contact details only if you are allowed to store them here.

## Digest Bridge

The Google Sheet used by Apps Script is not a database.

It only stores digest metadata:

- Send date.
- Recipient.
- Priority.
- Title.
- Community.
- Reason.
- Status.
- Due date.
- Record ID.
- Sent state.

No official documents or document contents belong in the digest bridge.
