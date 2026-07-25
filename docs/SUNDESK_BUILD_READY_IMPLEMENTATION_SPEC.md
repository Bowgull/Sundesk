# Sundesk Build Ready Implementation Spec

Date: 2026-05-10

This is the build-ready layer for the Sundesk redesign. The deck remains the source of truth. This spec turns the recent decisions into implementation targets so the next build sessions can move without changing direction.

## Non-Negotiables

- Sundesk is a web app first.
- Lindsay must be able to use it on desktop and iPhone.
- Lindsay and Josh must be able to log in with Google.
- Data, preferences, onboarding progress, Sundesk Lab progress, custom tags, and RuPaul Mode must sync across devices before this is Lindsay-ready.
- Local-only build is acceptable during development.
- No Firebase writes happen unless Josh explicitly approves.
- No AI integration ships in Sundesk.
- Help search is local search over authored help content, synonyms, module links, and troubleshooting cards.
- Lindsay never sees Markdown as an export format.
- Meeting notes export to PDF.
- Today remains home.
- Build stays visible in the main navigation.
- Sundesk must feel simpler than Airtable in daily use, while still supporting tables, records, fields, linked records, backlinks, lookups, rollups, counts, views, automations, and interfaces over time.

## Build Order

1. Meeting PDF export.
2. Education state and sync model.
3. Guided onboarding overlay with exact target clicks.
4. Multi-tag and checkbox option polish.
5. Sundesk Lab sandbox and module shell.
6. Local Help search and article routing.
7. RuPaul Mode copy system.
8. iPhone PWA QA pass.
9. Firestore shared workspace sync only after explicit approval.

## Shared Education State

Add a single education state object that can live locally now and in Firestore later.

Local key:

```ts
const educationStateStorageKey = 'sundesk-education-state-v1'
```

Firestore snapshot field:

```ts
educationState?: SundeskEducationState
```

Shape:

```ts
export interface SundeskEducationState {
  version: 1
  onboarding: {
    status: 'notStarted' | 'inProgress' | 'completed' | 'dismissed'
    currentStepId: string | null
    completedStepIds: string[]
    completedActionIds: string[]
    startedAt: string | null
    completedAt: string | null
    lastSeenAt: string | null
  }
  lab: {
    activeModuleId: string | null
    sampleWorkspaceVersion: 1
    sampleWorkspaceResetAt: string | null
    modules: Record<string, {
      status: 'notStarted' | 'inProgress' | 'completed'
      currentStepId: string | null
      completedStepIds: string[]
      completedActionIds: string[]
      startedAt: string | null
      completedAt: string | null
      lastSeenAt: string | null
    }>
  }
  help: {
    recentQueries: string[]
    dismissedCardIds: string[]
    lastArticleId: string | null
  }
  copyMode: {
    rupaulMode: boolean
    updatedAt: string | null
  }
  meetingPdf: {
    templateVersion: 1
    lastExportedMeetingId: string | null
  }
}
```

Rules:

- Local state writes immediately.
- Firestore sync is wired behind the existing shared workspace boundary after approval.
- Education state must not contain Lindsay's private record contents.
- Sample Lab state is separate from the real workspace.
- Continue and Start over depend on this state.

## Guided Onboarding Model

There is one first-run flow. No separate Start Here checklist.

First modal:

- `Start the tour`
- `Start on my own`

If Lindsay chooses the tour, the app dims the screen and annotates real UI surfaces. Each actionable step advances only when the target action actually happens.

Implementation:

- Every targetable control gets a stable `data-onboarding-target`.
- Every guided step has a `requiredAction`.
- The step advances from app state or event confirmation, not from a loose click listener.
- If a target is not mounted, the app navigates to the required surface first.
- Skip is always available.
- Restart tour is available from Help and Settings.

Target map:

| Step | Surface | Target | Required action | Completion signal |
| --- | --- | --- | --- | --- |
| welcome | Any | `onboarding-welcome` | Start tour | `onboarding.status === 'inProgress'` |
| today | Today | `nav-today` | View Today | Today route mounted |
| build-nav | Main nav | `nav-build` | Click Build | active view is Build |
| table-tabs | Build | `build-table-tabs` | Select a table | active table id changes or confirms |
| table-meaning | Build | `build-active-table` | View table | active table rendered |
| record-meaning | Build grid | `build-record-row` | Open a record | drawer opens for selected record |
| field-meaning | Build | `build-add-field` | Open field controls | add field modal opens |
| field-types | Add field modal | `field-type-menu` | Open type menu | type menu opens |
| tags | Build grid or drawer | `field-tags-cell` | Add or inspect tags | tags field has multiple values or menu opens |
| linked-records | Build grid or drawer | `linked-record-cell` | Open link control | linked record picker opens |
| views | Build toolbar | `build-view-controls` | Open view controls | view menu opens |
| meetings | Main nav | `nav-meetings` | Open Meetings | Meetings route mounted |
| meeting-pdf | Meetings | `meeting-export-pdf` | Export PDF | PDF export handler resolves |
| lab | Main nav | `nav-sundesk-lab` | Open Sundesk Lab | Lab route mounted |
| done | Lab | `lab-module-list` | Finish | onboarding status completed |

Plain onboarding copy should sound like Josh talking to Lindsay, not like product documentation.

Copy spine:

- Welcome: `Meep, this is Sundesk. Today is where the day starts, Build is where the structure lives, and we are going to make the whole thing click without turning this into homework`
- Today: `Today is the look-at-this-first screen, because the chaos has to stand in one line eventually`
- Build: `Build is where tables live. Tables are the buckets, records are the stuff inside them, and this is the bit that makes Sundesk make sense`
- Table: `A table is one kind of thing you track, like communities, work, approvals, people, meetings, or risks`
- Record: `A record is one actual item in a table: one task, one person, one meeting, one community`
- Field: `Fields tell Sundesk how to treat information, so a date can land in Today, a link can connect work, and tags can help you find the weird little things later`
- Tags: `Tags are your own labels. Add more than one when one label is not enough, because obviously one label is never enough`
- Linked records: `Links are how one record points to another, so a task can belong to a community and still show up in the places that need it`
- Views: `Views are different ways to look at the same table, so you can filter, sort, group, colour, save, and pin the angle that helps`
- Meeting PDF: `Export your meeting note PDF, and remember to send Josh your template to fine tune this better for you my pookie`
- Lab: `Sundesk Lab is the practice room. Fake GTA chaos, real Sundesk moves, no risk to your actual workspace`

## Field Type Teaching

Onboarding gives a surface-level explanation once. Sundesk Lab gives the deeper practice.

Field explanations:

- Text: `Short labels, names, titles, and quick details`
- Long text: `Notes, context, updates, and anything that needs room`
- Number: `Counts, amounts, percentages, square footage, budget numbers, and scores`
- Date: `Due dates, meetings, follow-ups, expiry dates, renewal dates, and timelines`
- Status: `One current stage, like Not started, Waiting, In review, or Done`
- Checkbox: `Yes or no tracking, like sent, approved, received, urgent, or needs follow-up`
- Tags: `Multiple labels on one record, so a task can be Waiting, COI, Steph, and Friday all at once`
- Link: `A connection to another table, like a task connected to a community, person, meeting, or document`
- Lookup: `Information pulled from a linked record so she does not retype it`
- Rollup: `A calculated summary from linked records, like count, total, earliest date, latest date, or open items`

## Multi-Tag Behavior

Use case:

Lindsay needs to tag one record with several real-world labels, such as `Waiting on Steph`, `COI`, `Urgent`, `Friday`, or `Boss review`.

Build requirements:

- Multi-select fields allow multiple values on one record.
- Users can type to create a new tag.
- New tag options are saved to the field definition.
- Tags render as compact chips in Build, Today, Timeline, drawer, and meeting prep.
- Today can show tag route chips for surfaced records.
- Clicking a tag route opens Build filtered to that tag.
- Filters can include one tag or several tags later.
- CSV export, backup export, local storage, and Firestore snapshots preserve tag arrays.
- Tags do not need visible colour names.

Acceptance checks:

- Add 3 custom tags to one task.
- Reopen the task and confirm all 3 tags remain.
- Click a Today tag route and confirm Build opens with that route applied.
- Rename a tag option and confirm existing records update or intentionally preserve historical text. Choose one behavior before implementation. Preferred: update existing records when renaming an option.

## Checkbox Option Polish

The flag icon for checkbox options must render correctly in every state.

Requirements:

- Checkbox style controls use recognizable check, flag, or toggle affordances.
- Colour options show swatches without colour names.
- Swatches must be distinct enough to scan.
- Selected state must be obvious without relying only on colour.
- Works in modal, drawer, grid cell, and iPhone viewport.

Suggested swatch set:

```ts
['#4f628f', '#6f5a80', '#d96d72', '#f49a8e', '#f3bb84', '#f5dca5', '#58a9c9', '#7aa0bf']
```

## Meeting PDF Export

Lindsay should not have to know what Markdown is.

Current Lindsay-facing actions should become:

- `Copy note`
- `Export PDF`
- `Copy agenda`
- `Export agenda PDF` if agenda export remains visible

Remove or hide `Export .md` from Lindsay-facing UI.

PDF implementation:

- Browser-side generation.
- No server service.
- No AI.
- Filename: `sundesk-meeting-note-{meeting-slug}-{yyyy-mm-dd}.pdf`
- Agenda filename: `sundesk-meeting-agenda-{meeting-slug}-{yyyy-mm-dd}.pdf`
- Include plain text, not Markdown syntax.
- Include source metadata where useful.

Meeting note PDF structure:

1. `Sundesk meeting note`
2. Meeting title.
3. Date.
4. Communities.
5. Work linked.
6. Risks and blockers.
7. Waiting on.
8. Decisions.
9. Next steps.
10. Source records.
11. Footer: `Built from Sundesk`

Implementation preference:

- Add a small browser PDF dependency only if needed.
- If adding one, prefer a client-side library with no runtime service dependency.
- Keep the PDF template in `src/data/meetingPdf.ts` or a similarly small data utility, not inside the React component.

## Sundesk Lab

Sundesk Lab is a sandbox with fake GTA-style data. It teaches the full machine without touching Lindsay's real workspace.

Lab navigation:

- Main nav item: `Sundesk Lab`
- Help search result cards can deep-link to Lab modules.
- Settings can reset Lab sample data and progress.

Sample data tone:

- GTA places, people, and work scenarios.
- Funny enough to feel personal.
- Still useful enough to teach real Sundesk work.
- No real Lindsay, SALTXC, permit, contract, COI, or private data.

Module list:

| Module | Teaches | Required practice |
| --- | --- | --- |
| First look | Today, Build, Meetings, Lab | Navigate each surface |
| Tables | What tables are | Switch tables and open table menu |
| Records | What records are | Open, edit, and close one record |
| Fields | Field types | Add one field in sample data |
| Tags | Multi-label work | Add several custom tags to one record |
| Links | Relationships | Link a task to a community |
| Views | Filter, sort, group, colour, save | Create or modify one sample view |
| Today | Surfacing work | Route from Today into Build |
| Meetings | Meeting prep and PDF | Build and export a sample meeting PDF |
| Timeline | Time-based work | Inspect a dated record route |
| Safety | Backup, import, privacy disclaimer | Find the settings disclaimer |
| iPhone | PWA habits | Practice the mobile navigation pattern |

Lab progress:

- Each module has Continue and Start over.
- Progress syncs across desktop and mobile once shared settings are active.
- Reset sample data does not reset real workspace data.
- Reset progress is explicit and scoped to Lab only.

## Help Search

Help is local. No chatbot.

Search source:

- authored help articles.
- help card titles.
- synonyms.
- Lab module titles.
- troubleshooting cards.
- route metadata.

Article set:

| ID | Title | Synonyms | Route |
| --- | --- | --- | --- |
| `start` | Start with Today | home, dashboard, where do I begin | Today |
| `build` | Build is where structure lives | tables, database, setup | Build |
| `tables` | Tables, records, fields | spreadsheet, Airtable, rows, columns | Build |
| `fields` | Field types | date, status, checkbox, tags, link | Lab fields |
| `tags` | Tags and labels | label, waiting, Steph, filter | Lab tags |
| `links` | Linked records | relationship, connected, backlinks | Lab links |
| `views` | Views | filter, sort, group, save | Lab views |
| `meetings` | Meeting notes and PDFs | agenda, export, boss, PDF | Meetings |
| `lab` | Sundesk Lab | sandbox, practice, sample | Sundesk Lab |
| `iphone` | Use Sundesk on iPhone | mobile, home screen, PWA | Help |
| `privacy` | Privacy and at-your-own-risk note | settings, data, disclaimer | Settings |
| `rupaul` | RuPaul Mode | voice, copy, plain version | Settings |
| `backup` | Backup and restore | export, import, local copy | Settings |

Issue surfacing without AI:

- Search synonyms.
- Empty result suggestions.
- Troubleshooting cards.
- Links to relevant Lab modules.
- Plain fallback: `Can’t find it here? Send Josh what you were trying to do and where you got stuck`

## RuPaul Mode

RuPaul Mode is a Settings toggle. It affects the whole system copy layer, not only onboarding.

Settings presentation:

- Toggle label: `RuPaul Mode`
- Helper copy: `Long hover shows plain version`
- The control can have a small glam treatment: warmer border, tiny sparkle accent, and a richer active state.
- Do not turn the Settings page into a stage. It should still feel like Sundesk.

Plain-copy reveal:

- Desktop: hover/focus for 500ms reveals the plain string.
- Mobile: long press for 500ms reveals the plain string.
- Reveal text does not say `Original:`.
- It simply shows the plain label, such as `Export PDF`.

Copy system:

```ts
type CopyMode = 'plain' | 'rupaul'

interface CopyEntry {
  id: string
  plain: string
  rupaul: string
  scope: 'navigation' | 'button' | 'empty' | 'toast' | 'help' | 'onboarding' | 'danger'
  revealPlain?: boolean
}
```

Rules:

- Functional labels can stay short if the job requires clarity.
- Destructive actions must remain clear.
- Danger copy can be funny around the action, not unclear inside the action.
- No copyright catchphrases.
- No impersonation line-for-line.
- Voice direction: camp, sharp, affectionate, useful, a little vulgar only where it helps.
- The system should feel like a ridiculous alternate copy layer, not random synonyms.

Starter copy map:

| ID | Plain | RuPaul Mode |
| --- | --- | --- |
| `nav.today` | Today | Today. The mess has been called to the stage |
| `nav.build` | Build | Build. Give the chaos a backbone |
| `nav.meetings` | Meetings | Meetings. Bring receipts |
| `nav.settings` | Settings | Settings. Touch things with intention |
| `nav.lab` | Sundesk Lab | Sundesk Lab. Practice the drama safely |
| `button.copyNote` | Copy note | Copy the receipts |
| `button.exportPdf` | Export PDF | Export the PDF, darling |
| `button.copyAgenda` | Copy agenda | Copy the agenda before somebody freestyles |
| `button.addField` | Add field | Add a new little rule |
| `button.addRecord` | Add record | Add the next problem |
| `button.saveView` | Save view | Save this angle |
| `button.resetLab` | Reset sample data | Reset the fake chaos |
| `button.deleteTable` | Delete table | Delete table |
| `danger.deleteTableHelp` | This deletes the table. | This chop is real. The table leaves the room |
| `empty.today` | Nothing needs attention right now. | Nothing is screaming right now. Suspicious, but we move |
| `empty.build` | Add a record to get started. | Add a record and give this thing somewhere to live |
| `toast.tagRoute` | Tag route opened. | Tag route opened. Follow the label, babe |
| `help.noResults` | No help results found. | No help found for that. Try a messier word |
| `onboarding.tags` | Tags are your own labels. | Tags are your little labels for when the drama has range |
| `settings.disclaimer` | Use Sundesk for sensitive information at your own risk. | Put sensitive things in here at your own risk, my pookie |

RuPaul Mode build acceptance:

- Toggling mode updates visible system copy.
- Plain reveal works on desktop and mobile.
- Preference persists locally.
- Preference syncs through shared workspace settings after Firebase writes are approved.
- All button actions still pass by accessible name or an explicit test id.
- E2E tests can run in plain mode and RuPaul Mode.

## Settings Privacy Disclaimer

The disclaimer belongs in Settings, not as a loud first-run warning.

Suggested placement:

- Settings section: `Data and privacy`
- Small text below backup or sync controls.

Plain copy:

`Use Sundesk for sensitive information at your own risk. Josh can help tune the setup, but you still choose what belongs in the app`

RuPaul Mode copy:

`Put sensitive things in here at your own risk, my pookie. The system can organize the mess, but it cannot make a secret less secret`

## iPhone PWA Acceptance

Viewport checks:

- 390 x 844
- 393 x 852
- 430 x 932

Required:

- Manifest has the Sundesk logo icon.
- Desktop bookmark favicon uses the logo.
- Add to Home Screen icon uses the logo.
- Safe-area padding works.
- Main nav is reachable without crowding.
- Today remains the first useful screen.
- Build grid has a mobile-safe path to inspect and edit records.
- Onboarding spotlight never covers the target action.
- Onboarding card fits without clipping.
- Long press plain-copy reveal works.
- Sundesk Lab modules can continue on mobile.
- PDF export is reachable on mobile.
- Settings toggle state remains clear.
- Text does not overflow buttons or compact cards.

## Worker Split For Next Build Block

Use 3 workers plus main coordination.

Main thread:

- Keep source of truth aligned.
- Integrate worker changes.
- Run tests.
- Commit and push sensible checkpoints.
- Write Obsidian handoff at the session boundary.

Worker 1: Meeting PDF export.

- Replace Lindsay-facing Markdown export.
- Add PDF generator utility.
- Wire `MeetingPrepPanel`.
- Add unit and smoke coverage for the PDF action.

Worker 2: Education state and onboarding engine.

- Add education state storage.
- Add target metadata.
- Add first-run tour state machine.
- Add restart tour entry points.

Worker 3: Tags, checkbox polish, and field teaching readiness.

- Confirm multi-tag behavior everywhere.
- Add missing tag persistence tests.
- Fix checkbox flag and swatch presentation.
- Add target ids needed by onboarding.

Next block after integration:

- Sundesk Lab sample workspace and modules.
- Help search.
- RuPaul Mode copy map.
- iPhone PWA QA pass.

## Build Ready Checklist

- Deck is source of truth.
- Product scope is web app first.
- Sync is required for final Lindsay-ready state.
- No AI is in scope.
- Onboarding is one dimmed annotated flow.
- Onboarding click advancement is exact, target-based, and testable.
- Field types are taught once in onboarding.
- Sundesk Lab teaches the full system with fake GTA data.
- Sundesk Lab remembers progress and can restart.
- Tags support multiple labels per record.
- Tags surface in Today, Build, Timeline, drawer, meetings, exports, backup, and shared state.
- Checkbox option icon and swatches get a real visual pass.
- Meeting notes export to PDF.
- Markdown export is not Lindsay-facing.
- Help is local search plus Lab links.
- RuPaul Mode is system-wide, toggleable, persistent, and plain-copy-revealable.
- Settings contains the privacy disclaimer.
- iPhone PWA gets explicit QA.
- Workers have disjoint first tasks.
