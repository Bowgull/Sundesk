# Sundesk Command Center UI/UX Deep Dive

This is the front-end polish anchor for Sundesk.

The app should end up matching the Command Center Training Manual deck. If the live app disagrees with that deck, the live app is behind.

## Source Of Truth

Deck:

`/Users/lindsaybell/Downloads/sundesk-command-center-training-manual.pptx`

Repo copy:

`/Users/lindsaybell/Documents/Codex/2026-05-07/files-mentioned-by-the-user-task/sundesk/outputs/manual-20260508-sundesk-demo/presentations/sundesk-command-center-training/output/sundesk-command-center-training-manual.pptx`

Obsidian deck:

`/Users/lindsaybell/Library/CloudStorage/GoogleDrive-bocas.joshua@gmail.com/My Drive/CereBro-Vault/07_Knowledge/obsidian-vault/60_Media/PPTX/Sundesk/Decks/2026-05-08 Sundesk Command Center Training Manual.pptx`

Obsidian note:

`/Users/lindsaybell/Library/CloudStorage/GoogleDrive-bocas.joshua@gmail.com/My Drive/CereBro-Vault/07_Knowledge/obsidian-vault/60_Media/PPTX/Sundesk/Notes/2026-05-08 Sundesk Command Center Training Manual.md`

Obsidian handoffs:

`/Users/lindsaybell/Library/CloudStorage/GoogleDrive-bocas.joshua@gmail.com/My Drive/CereBro-Vault/07_Knowledge/obsidian-vault/90_Archive/Sundesk Build History/snapshots/2026-05-08 0724 Sundesk Session Handoff - Command Center Training Deck.md`

`/Users/lindsaybell/Library/CloudStorage/GoogleDrive-bocas.joshua@gmail.com/My Drive/CereBro-Vault/07_Knowledge/obsidian-vault/90_Archive/Sundesk Build History/snapshots/2026-05-08 0811 Sundesk Session Handoff - Final Build Target Deck.md`

SHA-256:

`8f09860694e89acfff9ea4bede844c23fda7a2ef5c70270eab37397c77e56905`

The Downloads, repo, and Obsidian PPTX copies match exactly.

## Product Stance

Sundesk is a command center, not a database lesson.

The first user should not meet schema before work.

Daily work starts from:

1. Today.
2. Waiting On.
3. Communities.
4. Meetings.
5. Timeline.

Build stays visible in the sidebar. Build is where structure changes.

The power stays under the floor:

- Tables.
- Fields.
- Links.
- Tags.
- Views.
- Rules.
- Firebase records later.

The daily user sees the result before the machinery.

## Deck-Locked Product Shape

The deck locks 20 product screens.

1. Start here.
2. Product map.
3. Build blank grid.
4. After-paste help.
5. Field behaviour.
6. Tag behaviour.
7. Links to communities.
8. Communities command center.
9. Today.
10. Waiting On.
11. Meetings.
12. Timeline views.
13. Kanban.
14. Calendar.
15. Timeline.
16. Graph.
17. Build freeform first.
18. Tiny helpers.
19. Data and access.
20. Routine.

This is the build sequence and the polish sequence.

## Visual Grammar

The deck has a calmer shell than the current app.

Core visual traits:

- Pale blue left rail.
- White work canvas.
- Rounded but restrained panels.
- Dark navy primary actions.
- Thin blue-gray borders.
- Small soft shadows.
- Dense tables and cards.
- Chips carry workflow meaning.
- Newsreader appears only in large editorial moments.
- Inter owns the product UI.
- No theme showcase in the main work path.

The deck does not feel like a marketing page. It feels like a controlled operating surface.

## Theme Direction

Use the sunset palette as the base colour world.

The base palette should pull from:

- Warm coral.
- Persimmon.
- Orange.
- Gold.
- Soft peach.
- Washed rose.
- Mauve.
- Purple.
- Blue-violet.
- Ocean blue.

The app should not become orange, purple, or sunset themed everywhere. The base product shell stays calm. Sunset colour appears through accents, chips, focus states, highlights, helpers, charts, and selected states.

Semantic colour still wins over decoration:

- Coral means blocked, fire, risk, destructive.
- Gold means waiting, due soon, pending.
- Blue means information, links, selected, system.
- Green means on track, done, received.
- Lavender or mauve means prep, meeting, Build.
- Purple can be used for brand depth, not as the default active state everywhere.

Themes need to be real themes, not shallow token swaps.

Each theme must define:

- Background.
- Rail.
- Work canvas.
- Panel surface.
- Elevated surface.
- Primary action.
- Secondary action.
- Link.
- Focus ring.
- Border.
- Muted text.
- Strong text.
- Semantic chips.
- Table header.
- Selected row.
- Hover row.
- Menu surface.
- Modal surface.
- Shadow style.

Initial theme set:

1. `Command Center`  
   The default deck theme. Pale blue rail, white work canvas, navy actions, soft sunset accents.

2. `Sunset`  
   The warm inspiration theme. Coral, orange, peach, mauve, purple. Good for Daily mode and presentation warmth, but tables must remain readable.

3. `Coast`  
   Ocean sky theme. Blue, mist, soft pink, peach, pale gold. Calm and open. This is the lightest emotional theme.

4. `Dusk`  
   Purple, blue-violet, rose, muted coral. More focused. Useful for evening work without becoming a dark mode.

5. `Graphite`  
   Work-heavy theme. Neutral surfaces, restrained blue, limited sunset accents. Best for dense Build use.

6. `Night Shift`  
   True dark theme. Navy and ink surfaces with sunset chips preserved for meaning. It must pass table readability before shipping.

Theme rules:

- Themes can change mood. They cannot change product hierarchy.
- Build grids must stay legible in every theme.
- Buttons must not rely on colour alone.
- Chips must keep semantic meaning across themes.
- Daily can carry more warmth than Build.
- Settings can preview themes, but theme controls should not clutter the work screens.

## Interaction Grammar

Build is paste-first.

The user should be able to copy cells from Google Sheets or Excel, click a grid cell, and paste directly into Sundesk.

No import wizard appears before value.

After paste, Sundesk may show tiny contextual helpers in headers or side panels:

- `Community` helper.
- `Status` helper.
- `Due` helper.
- `Tags` helper.

Helpers explain one thing at a time. They can be ignored.

Field types are column behaviours, not setup doctrine.

Tags do workflow work:

- Group.
- Surface.
- Route.
- Mark blockers.

Links connect rows to community profiles. Backlinks appear automatically.

## Current App Gap Inventory

The current React app has real engine work, but the front end is not yet at the deck.

Current resolved alignment:

- The sidebar now uses `Waiting On` instead of `Follow-ups`.
- Today is home.
- Build is visible in the sidebar.
- Timeline has the five deck view modes: Grid, Kanban, Calendar, Timeline, Graph.
- Visible digest wording has been replaced by command-send and summary language.
- Settings now puts engine counts and rule-routing details behind manual disclosure.
- Today now puts rule receipts behind manual disclosure.
- Build now keeps constructive actions visible and moves table admin actions behind `Table options`.
- Build now keeps only View, Filter, and `Shape grid` in the first toolbar read.
- Secondary grid controls now live behind `Shape grid`.
- Field creation and field editing now open on column behavior cards before raw type details.
- Work now has a visible `Tags` column with tag route chips in Build.
- Today now shows workflow tags on surfaced records.
- Today workflow tags now open Build as a filtered route for the selected tag.
- Timeline now exposes tag routes from the current record set and opens Build filtered to the selected tag.
- Communities now show readiness, blockers, waiting count, meeting count, and next action in each place card.
- Community records now open with a place command strip in the drawer.
- Communities now have an in-screen place detail surface for readiness, event date, blockers, waiting, meetings, next action, and linked rows.
- Communities now switch the place detail in-screen before opening the full record.
- Communities now support quick editing status, event date, and readiness from the place detail.
- Communities now support status or level edits for linked rows inside the place detail.
- Communities now support adding and removing existing linked rows from the place detail.
- Communities now support creating a new linked row from the place detail.
- Communities new linked-row creation now exposes table-aware status or level and date fields when available.
- Communities new linked-row creation now exposes additional table-aware fields such as priority and tags.
- Communities place detail now routes into Build for Work, Waiting, and Meetings filtered by the selected place.
- Meetings now puts a generated weekly note object above the computed agenda and source receipts.
- Meetings now has an editable weekly-note draft with copy and export actions.
- Weekly note drafts now persist into the meeting record.
- Meetings weekly notes now show field chips for date, communities, work, waiting, approvals, risks, and note state.
- Meetings weekly notes now have structured section editors for decisions, risks, and next steps.
- Meetings weekly note sections now support source-record insertion.
- Meetings source-record insertion now routes records to Decisions, Risks, or Next steps.
- Meetings source records now have explicit Open routes back into Build.
- Meetings source-record routing now includes table-aware section decisions and visible route reasons.
- Build now shows post-paste helper cards for created rows, updated rows, columns read, and the next shape check.
- Build post-paste helpers now suggest likely field behavior from pasted values, including select-like status fields.
- Build post-paste helpers now expose one-click apply controls for suggested field behavior.
- Build post-paste apply controls now migrate existing values when text fields become dates, numbers, or tags.
- Today now has a first-read rail for Now, Waiting, Next, Changed, and Can slip before the deeper lanes and receipts.
- Today now has a touch-first focus band that names the first record, why it surfaced, and the open action.
- Timeline now gives every mode a receipt that states the question, record count, dated rows, dependency rows, and matched reads.
- Timeline Graph mode now has a place-focus control instead of locking to the first community.
- Timeline Kanban mode now supports one-click status movement on cards.
- Timeline Calendar mode now has date-focus buckets and a selected-day detail.
- Timeline readiness mode now has a place-focus panel with focused linked rows.
- The default deck skin now uses calmer flat backgrounds and reduced surface shadows.
- The app shell now keeps navigation first and tucks workspace/system receipts behind manual rail disclosure.
- Today now puts the count summary behind manual disclosure so the first read is hero, first-read cards, then touch-first focus.
- Sundesk now has the first parallel build lanes: shared app config in `src/appConfig.ts`, theme tokens in `src/styles/themes.css`, Build paste helper in `src/components/BuildPasteHelper.tsx`, and Waiting On in `src/components/WaitingOnScreen.tsx`.
- The second parallel block extracted Today into `src/components/TodayScreen.tsx`, moved Settings CSS into `src/styles/settings.css`, and added theme/config guardrails for longer worker runs.
- The third parallel block extracted Build toolbar/view controls into `src/components/BuildToolbar.tsx`, moved Timeline CSS into `src/styles/timeline.css`, and tightened TodayScreen internals without visible behavior changes.
- The fourth parallel block extracted the Timeline shell into `src/components/TimelineScreen.tsx`, moved Communities CSS into `src/styles/communities.css`, and tightened Build toolbar/paste helper internals without visible behavior changes.
- The fifth parallel block extracted Communities into `src/components/CommunitiesScreen.tsx`, moved Meetings CSS into `src/styles/meetings.css`, and tightened TimelineScreen internals without visible behavior changes.
- The sixth parallel block extracted Build saved views, Build rules, and Meetings into dedicated components while keeping App as the state coordinator.
- The seventh parallel block extracted the universal record drawer and Work screen into dedicated components while preserving drawer editing, backlinks, dependency editing, and daily route behavior.
- The eighth parallel block extracted the Build grid table shell into `src/components/BuildGrid.tsx` while preserving paste, inline edit, keyboard movement, field menus, and row actions.
- The ninth parallel block used workers to extract Build grid cells, record field inputs, and meeting prep into dedicated components while preserving the same tested behavior.
- The tenth parallel block used workers to extract Build field headers, Build modals, and Settings into dedicated components while preserving all tested modal, menu, theme, and settings behavior.
- The eleventh parallel block extracted the record modal and Timeline modes into dedicated components, and added a Lindsay-only web app deploy readiness note.
- The twelfth parallel block added the Firestore workspace snapshot layer, Google-login access helpers, the Auth gate surface, PWA bookmark assets, and the quiet Settings data-boundary disclaimer for the Lindsay-ready web app path.
- The thirteenth parallel block added Firebase Auth service helpers, a Firestore workspace client, tighter Firestore rules for `workspaces/lindsay-sundesk`, and Auth gate styling for the hosted app path.
- The fourteenth block wired the Auth gate into `App`, added Firebase Auth subscription, hydrated the shared Firestore workspace after approved sign-in, saved snapshots behind the explicit write gate, and removed the private email from `.env.example`.
- The fifteenth parallel block added auth-gated E2E coverage, a Lindsay launch checklist, Auth gate copy polish, and mobile-safe Auth gate spacing.
- The sixteenth block surfaced shared-workspace access and hydration status inside Settings, kept the local fallback visible, and clarified the empty-workspace first-save path.
- The seventeenth block added Firebase setup state detection with tests and surfaced local, partial, sign-in-ready, and write-ready states in Settings.
- The eighteenth block added next setup-step guidance, removed the hardcoded summary recipient email from Settings, and verified the launch-safe Settings copy.

Remaining gaps:

- Build post-paste apply controls now set field behavior and migrate simple text values into dates, numbers, and tags.
- Today, Timeline, Meetings, and Communities now all have deck-first routes back into Build.
- Communities can create, add, remove, quick-edit, and set richer table-aware fields on linked rows.
- Meetings source records now route with table-aware section decisions and visible route reasons.
- Kanban, Calendar, Timeline, and Graph now have mode receipts and first-pass interaction polish.
- Today has the stricter first read, touch-first focus band, and quieter count summary. It still needs deeper real-data hierarchy QA.
- App shell and sidebar have a first-pass deck audit. Continue surface QA for active, hover, mobile, and pinned-view density.
- The CSS mood has a first-pass deck calm layer. Continue tightening individual surfaces during later visual QA.
- Continue extracting screens/components so 3 long-running workers can build without colliding in `App.tsx` and `App.css`. Next likely seams: first-run shared workspace creation flow, Firebase setup QA, hosted preview smoke test after explicit approval, and production auth/write gate smoke tests with fake data.

## UI/UX Audit Checklist

Every screen needs a literal audit.

For each screen:

- What is the first thing the user reads.
- What is the primary action.
- What can be removed from first view.
- What belongs behind a helper, dropdown, modal, drawer, or field menu.
- Which words are too technical for Daily mode.
- Which colours carry meaning.
- Which buttons are primary, secondary, ghost, danger, or disabled.
- Which controls need icon buttons.
- Which menus need tighter grouping.
- Which empty state gives the next action.
- Which panel should not be a panel.
- Which typography role is wrong.
- Which spacing creates visual noise.
- Which hover, focus, loading, disabled, selected, and error states are missing.
- Which mobile state breaks the product model.

## Surface Audit Order

1. App shell and sidebar.
2. Today.
3. Waiting On.
4. Communities.
5. Meetings.
6. Timeline mode switcher.
7. Grid view.
8. Kanban view.
9. Calendar view.
10. Timeline view.
11. Graph view.
12. Build paste grid.
13. Build header helpers.
14. Field menu.
15. Tag settings.
16. Linked-record picker.
17. Record drawer.
18. Modals.
19. Settings.
20. Mobile.

## Implementation Stance

Do not polish around the old app.

Polish toward the deck.

The right move is not to add ornament. The right move is to reduce front-end friction until the app reads like the deck:

- Paste first.
- Explain after context.
- Keep Build powerful.
- Keep Daily calm.
- Let each screen answer one operational question.

That is the target.
