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

> Sundesk is built for operational status, not sensitive files or document contents. Upload sensitive information at your own risk. Do not add files, pasted document contents, permit files, COI files, contract text, private phone numbers, or sensitive contact details unless you are allowed to store them here.

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

## Obsidian

Obsidian export is not V1.

It can be considered later as a manual export of safe metadata:

- Table name.
- Record title.
- Status.
- Due date.
- Community.
- Public-safe notes.
- Links between records.

It must not export files, pasted document contents, private contact data, permit contents, COI files, contract text, or imported company data.
