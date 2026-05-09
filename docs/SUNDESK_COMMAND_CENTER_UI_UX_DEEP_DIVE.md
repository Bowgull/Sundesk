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
- Field creation and field editing now open on column behavior cards before raw type details.
- Communities now show readiness, blockers, waiting count, meeting count, and next action in each place card.
- Meetings now puts a generated weekly note object above the computed agenda and source receipts.

Remaining gaps:

- Build is paste-capable, but it still needs to feel even more paste-first.
- Build still has many controls once the user is in the grid. The deck makes the grid primary and moves explanation into tiny helpers.
- Tags are rendered, but they do not yet drive visible workflow routes.
- Communities are closer to the deck, but still need a deeper place-detail command center pass.
- Meetings has the weekly-note object, but still needs a deeper editable note format pass.
- Kanban, Calendar, Timeline, and Graph exist, but each needs a deeper full-screen polish pass.
- Today is calmer, but still needs a stricter first-read pass around what can slip, what changed, Now, Waiting, Next.
- The current CSS still carries some heavier mood from earlier iterations. The deck uses a calmer product skin.

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
