# Sundesk UI/UX Polish Spec

This is the final polish target.

Nothing here is optional styling. These are product decisions.

## Product Feel

Sundesk is warm, friendly, less intimidating, and still extremely functional.

It is not cute.
It is not a spreadsheet clone.
It is not a dashboard wall.

It should feel like a calm operations desk with a real database underneath.

The intended user is Lindsay: capable, busy, not deeply technical, willing to learn when the system explains itself clearly.

The product should make her feel oriented. Not managed.

## Interaction Model

Sundesk has 3 modes.

### Daily mode

Daily mode is Today, Communities, Tasks, Follow-ups, Meetings, and Timeline.

It is guided, warm, and low machinery.

Daily mode shows:

- What needs attention.
- Why it surfaced.
- What opens next.

It hides:

- Schema setup.
- Field mechanics.
- View configuration unless the user asks for it.
- Rule editing unless the user opens Build.

### Build mode

Build mode is the workshop.

It is grid-first, denser, and more explicit.

Build mode shows:

- Table tabs.
- Saved views.
- Fields.
- Records.
- Inline editing.
- Field menus.
- View tools.
- Rules.

Build mode must not feel like developer mode.

### Record mode

Record mode is focused reading and editing.

Records open in a side drawer for normal work. Creation and settings can use modals.

Record mode shows:

- Title.
- Key status.
- Fields.
- Linked records.
- Backlinks.
- Dependencies.
- Activity later.

The record should read like a focused page, not a database row stretched tall.

## Today

Today is a morning brief with lanes underneath.

The first read is:

1. What needs my attention.
2. Why it matters.
3. What I should open next.

Today uses 3 lanes:

- Now.
- Waiting.
- Next.

Rules are not a fourth lane. Rules explain why records surfaced.

Today cards show one primary reason. Extra reasons collapse behind `Why this is here`.

Card shape:

- Record title.
- Table or work type.
- Status or date.
- Primary reason.
- Open action.

Do not show all rule chips inline.
Do not show repeated copies of the same record across lanes unless the duplicate reason is materially different.
Deduplicate Today before polish ships.

## Build

Build opens grid-first.

Default first table is Risks only on first run. After that, remember the last active Build table.

Build order:

1. Header.
2. Table tabs.
3. View toolbar.
4. Grid.
5. Saved views.
6. Rules.

The record drawer must not appear above the grid by default.

Build uses inline editing as the primary editing path.

Grid behavior:

- Single click selects a cell.
- Enter edits a cell.
- Escape cancels.
- Tab moves right.
- Shift Tab moves left.
- Arrow keys move cell focus.
- Double click edits.
- Space or expand icon opens the record drawer.
- Add row sits at the bottom.
- Add field sits at the far right.
- Column header opens the field menu.

Row heights:

- Compact: 32px.
- Comfortable: 40px.
- Expanded: 56px.

Default density is Comfortable.

## Typography

Use two font roles.

### UI font

Use Inter for interface text, tables, buttons, forms, labels, chips, menus, and drawers.

If accessibility testing shows a clear readability win, Atkinson Hyperlegible can replace Inter for the UI font.

### Display font

Use Newsreader only for:

- Today hero.
- Major system reads.
- Large empty states where the moment benefits from warmth.

Do not use Newsreader in:

- Grid cells.
- Table headers.
- Menus.
- Forms.
- Buttons.
- Small cards.

### Size scale

- Page title: 32px to 44px.
- Today hero title: 40px to 44px.
- Section title: 20px to 24px.
- Panel title: 16px to 18px.
- Record title: 18px to 22px.
- Body: 14px.
- Dense body: 13px.
- Metadata: 12px.
- Tiny labels: 11px.

Do not scale type with viewport width.
Do not use negative letter spacing.

### Weight scale

- Normal text: 400.
- Body emphasis: 600.
- Record titles: 700.
- Counts and primary headings: 800.
- Avoid 900 except for rare badges or section markers.

Current heavy weights should be reduced during polish.

### Label style

Use fewer all-caps labels.

All-caps is allowed for:

- Tiny section markers.
- Table field type tags.
- System labels where scan speed matters.

Prefer sentence case for daily UI and empty states.

## Colour System

Colour carries meaning before decoration.

Semantic colour rules:

- Coral: blocked, fire, risk, destructive.
- Gold: waiting, due soon, pending.
- Blue: information, links, selected, system.
- Green: on track, done, received.
- Lavender: prep, meeting, Build.
- Gray: inactive, empty, archived, not relevant.

Arbitrary option colours must never outrank status colour.

Table surfaces stay calm.
Today can be warmer.
Build must be crisper.

## Themes

Sundesk ships 5 themes.

### Sunrise Soft

Default.

Warm, friendly, and Lindsay-first.

Use:

- Light cloud background.
- Peach and gold warmth.
- Navy text.
- Soft blue selection.
- Coral only for real attention.

### Cloud Light

Most functional.

Use:

- White and cloud blue surfaces.
- Crisp borders.
- Minimal warmth.
- Strong grid readability.

This is the best theme for long Build sessions.

### Sunset Bold

Expressive warm theme.

Use:

- Peach.
- Coral.
- Soft gold.
- Navy text.

Do not let this become orange-heavy.
It should feel branded, not lifestyle.

### Focus Dark

Dark navy, not black.

Use:

- High contrast text.
- Muted blue surfaces.
- Visible chips.
- Coral and gold with enough contrast.

Dark mode is for focus, not drama.

### Paper Light

Rename current `Light` to `Paper Light`.

Use:

- Warm white.
- Charcoal text.
- Minimal gradients.
- Low visual noise.

This is the best theme for screenshots, printing, and calm review.

## Theme Picker

Theme picker uses visual swatches, not text-only buttons.

Each swatch shows:

- App background.
- Panel surface.
- Text.
- Accent.
- Status chip.
- Primary button.

The selected theme has a clear outline and checkmark.

## Buttons

Button decisions are fixed.

### Types

Primary:

- Navy fill.
- One per surface.
- Used for `Add record`, `Save`, `Run setup`, `New rule`.

Secondary:

- Raised white or theme surface.
- Used for `Edit`, `Preview digest`, `Save view`, `Apply`.

Ghost:

- Low-emphasis.
- Used for toolbar actions, cancel, and secondary navigation.

Danger:

- Coral tint.
- Used for delete, reset, and remove.

Icon-only:

- Used in toolbars, table headers, compact repeated actions, and close controls.
- Must have a tooltip or accessible label.

Split button:

- Used for `Add` later.
- Main click performs the default action.
- Chevron opens choices.

### Sizes

- Icon: 32px by 32px.
- Compact: 32px height.
- Default: 36px height.
- Large: 42px height.
- Touch target: 44px minimum on mobile.

Default button padding:

- Compact: 10px horizontal.
- Default: 12px to 14px horizontal.
- Large: 16px horizontal.

No full-width primary buttons except:

- Modal actions on mobile.
- Empty states.
- Critical setup steps.

### States

Every button needs:

- Default.
- Hover.
- Active.
- Focus.
- Disabled.
- Loading.
- Selected where relevant.

Disabled buttons explain why when the reason is not obvious.

Loading buttons keep their width.

Danger actions require confirmation when they delete data or reset local state.

## Dropdowns And Menus

Do not blur selects, menus, and pickers.

### Select dropdown

Use for choosing a field value:

- Status.
- Priority.
- Table.
- Field type.
- Theme.
- Rule operator.

Behavior:

- Shows current value.
- Checkmark marks selected value.
- Search appears after 7 options.
- Enter selects.
- Escape closes.
- Arrow keys move.

### Action menu

Use for choosing an action:

- Edit.
- Rename.
- Duplicate.
- Hide.
- Pin.
- Delete.

Behavior:

- Destructive actions are separated at the bottom.
- Menu width is 220px to 280px.
- Menu max height is roughly 320px.
- It scrolls inside.

### View menu

Use for table view controls:

- Fields.
- Filter.
- Sort.
- Group.
- Colour.
- Density.

The Build toolbar owns these menus.

### Picker popover

Use for linked records and record search.

Picker popovers show:

- Search input.
- Current selected records.
- Suggested records.
- Table label.
- Status and date context.
- Create new record option.

Picker records must use readable labels:

`Halifax · At risk · May 22`

Not:

`community_halifax`

## Build Toolbar

Build toolbar order:

1. View.
2. Fields.
3. Filter.
4. Sort.
5. Group.
6. Colour.
7. Density.
8. Export later.

Today does not use this toolbar.

## Field Header Menu

Every grid field header has a menu.

Menu order:

1. Edit field.
2. Rename.
3. Change type.
4. Hide from view.
5. Sort ascending.
6. Sort descending.
7. Group by this field.
8. Duplicate field.
9. Delete field.

Delete stays last.

The primary field cannot be deleted.

## Inputs

Inputs use calm borders and clear focus states.

Input types:

- Text.
- Long text.
- Number.
- Price.
- Percent.
- Date.
- Date and time.
- Checkbox.
- Single select.
- Tags.
- Linked record picker.
- Lookup preview.
- Rollup preview.
- Count preview.
- Search.

Focus ring:

- 2px outline.
- Uses theme accent.
- Visible in every theme.

Error state:

- Coral border.
- Short message below.
- Message states the fix.

Example:

`Choose a linked table before saving.`

## Chips

Chips carry specific meanings.

Status chip:

- Semantic colour.
- Highest visual priority.

Priority chip:

- Uses semantic colour where possible.

Linked record chip:

- Pale blue or neutral.
- Clickable.
- Opens the linked record.

Rule reason chip:

- Quiet outline.
- Low emphasis.

Count chip:

- Small circle or pill.
- Used in tabs and lane headers.

Field type chip:

- Tiny and muted.

Danger chip:

- Reserved for blocked, fire, destructive, or risk.

Do not use chips as decoration.

## Record Drawer

Normal record work uses a side drawer.

Drawer width:

- Desktop: 420px to 520px.
- Wide desktop: can expand to 620px.
- Mobile: full screen.

Drawer structure:

1. Header.
2. Key status strip.
3. Primary fields.
4. Linked records.
5. Backlinks.
6. Dependencies.
7. Notes later.
8. Activity later.

Empty sections collapse by default.

Show a quiet empty line only when the absence matters:

`No records point here.`

## Modals

Use modals for bounded setup.

Modal types:

- Add table.
- Field settings.
- Table settings.
- Delete confirmation.
- Reset local data.
- Rule editor when complex.

Sizes:

- Confirm: 420px.
- Standard form: 560px.
- Field or rule builder: 720px.

Modal action order:

- Secondary action left.
- Primary or danger action right.

Escape closes non-destructive modals.
Escape does not confirm destructive actions.

## Tabs

Use tabs only for:

- Build table tabs.
- Saved view tabs.
- Settings sections.

Do not add tabs inside every card.

Tab states:

- Default.
- Hover.
- Selected.
- Focus.
- Changed view.

Changed saved views show a subtle gold marker.

## Empty States

Empty states give the next action.

Good:

`No follow-ups due. Add one or open Waiting.`

Bad:

`Nothing here yet.`

Empty states must not praise the user.

## Toasts

Toasts are factual.

Use:

- `Saved.`
- `Field added.`
- `Rule updated. 3 records match.`
- `Delete failed. Try again.`

Do not use praise, exclamation marks, or apology loops.

## Mobile

Mobile must stay usable, but it does not need to expose every Build power first.

Mobile rules:

- Sidebar becomes a bottom or drawer nav.
- Today becomes one column.
- Lanes stack.
- Build grid scrolls horizontally.
- Record drawer becomes full screen.
- Toolbar actions collapse into a `View` menu.
- Touch targets are at least 44px.

## Accessibility

Required before polish is done:

- Visible focus rings.
- Keyboard path through grid, menus, modals, and drawer.
- Escape closes menus and non-destructive modals.
- Contrast passes normal text in every theme.
- Icon-only buttons have labels.
- Colour is never the only status indicator.
- Text never overlaps its container.

## Component Priority

Polish order:

1. Build grid inline editing.
2. Field header menus.
3. Linked record picker.
4. Record drawer.
5. View toolbar.
6. Button system.
7. Dropdown and menu system.
8. Chip system.
9. Theme picker.
10. Empty and toast states.
11. Mobile pass.
12. Accessibility pass.

## Competitive Decisions

Sundesk borrows deliberately.

- Airtable: grid logic, saved views, field menus, inline editing.
- Baserow: grid discipline and predictable row behavior.
- SmartSuite: readable record drawer and relationship clarity.
- Notion: calm record focus and page-like readability.
- Coda: guided work surfaces where notes and structured data meet.
- Monday: status colour and scan speed.
- ClickUp: the warning. Do not expose every tool at once.

## Final Standard

Lindsay should be able to open Today, understand the day, and open the right record without learning the database.

She should be able to open Build, edit the structure, and see exactly how it changes Today.

That is the polish target.
