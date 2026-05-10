# Sundesk Onboarding And Lab Plan

Status: planned. No AI integration. No deploy. No Firebase writes until approved.

This plan turns the onboarding, Sundesk Lab, meeting PDF, RuPaul Mode, and iPhone PWA decisions into the build path.

The goal is not to make Lindsay read a manual. The goal is to help her understand the spine of Sundesk once, then give her a safe place to practice everything else.

## Product Rule

Onboarding teaches the spine.

Sundesk Lab teaches the machine.

The spine is:

`Table -> record -> field -> linked record -> view -> Today -> meeting PDF`

Tables are not optional. Tables are the product logic. Today, Communities, Meetings, Timeline, Rules, views, exports, and records all depend on tables.

The first-time tour must teach tables once at a surface level. It must not become a full database course.

## No AI

This system uses no AI.

- No OpenAI.
- No model calls.
- No chat assistant.
- No paid AI usage.
- No server inference.

Search is local text matching over help articles, module titles, tags, synonyms, and troubleshooting cards.

## Sync Requirement

This system must sync across desktop and mobile for the real Lindsay-ready app.

Local storage can be used while building locally, but the final version must persist these through the shared workspace once Firestore writes are approved:

- onboarding status.
- current onboarding step.
- dismissed onboarding choice.
- onboarding action completions.
- Sundesk Lab module progress.
- current Sundesk Lab module step.
- completed Sundesk Lab modules.
- module start-over events.
- sample workspace state.
- custom tag field options and tag values.
- Help/Sundesk Lab search preferences if useful.
- RuPaul Mode preference.
- meeting PDF template preference if later editable.

If it does not sync across iPhone and desktop, it is not finished.

## First-Run Onboarding

First screen:

- `Walk me through it`
- `I'll poke around`

If Lindsay chooses onboarding, Sundesk dims the screen with a soft brand overlay and annotates real surfaces.

The overlay should feel warm and elegant, not like a heavy black tutorial modal.

Each step has:

- spotlight target.
- short heading.
- human explanation.
- action when useful.
- Back.
- Next.
- Skip.
- progress count.

Copy style should feel like Josh built Lindsay a useful system and left clear notes inside it.

Use natural language. Do not overuse hard full-stop fragments. Keep UI labels clear. Use `my pookie`, `pookarella`, and `Meep` rarely, only where the moment benefits from being personal.

Onboarding is one flow. There is no separate Start Here checklist.

The same dimmed, annotated flow includes explanation steps and action steps.

Action steps advance only when Lindsay completes the exact intended action. They do not advance on random clicks.

Accuracy requirements:

- every target has a stable `data-onboarding-target`.
- every step has an action type.
- target click steps advance only when the exact highlighted target is clicked.
- route steps wait until the correct screen is open before advancing.
- record steps wait until the correct drawer/modal/grid state is visible.
- export steps wait until the export action is triggered.
- if Lindsay clicks outside the target, the flow stays on the same step.
- if she exits halfway, the flow resumes where she left off.

Settings has one control: `Restart onboarding`.

Restart onboarding restarts the same annotated flow. It does not erase workspace data.

### Required First Tour Steps

1. Welcome.
   - Teach that Sundesk is her work desk.
   - Today shows what needs attention.
   - Build holds the structure.

2. Today.
   - Teach that Today is home.
   - It reads dates, blockers, waiting items, and meeting prep.

3. Build.
   - Teach that Build is where tables live.
   - Tables are the spine.

4. Table.
   - A table is one kind of thing.
   - Communities, Work, Approvals, People, Meetings, and Risks are examples.

5. Record.
   - A record is one item inside a table.
   - One community, one task, one meeting, one person.

6. Field.
   - A field tells Sundesk how to treat one piece of information.
   - Date can land work in Today.
   - Link can connect a task to a community.
   - Tags can help the same record show up in more than one useful place.

7. Linked record.
   - Links connect records across tables.
   - This is how a task points to a community, approval, person, or risk.

8. View.
   - Views change how the same table is scanned.
   - Filter, sort, group, colour, save, and pin.

9. Meeting PDF.
   - Meeting notes can export as a PDF.
   - Use this exact onboarding line:
     `Export your meeting note PDF, then send Josh your template to fine tune this better for you my pookie.`

10. Sundesk Lab.
    - Sundesk Lab is the sandbox.
    - It lets her practice without touching her real workspace.

The first tour should not deep dive every field type, rule operator, timeline mode, or backup path.

### Field Type Surface Explanation

Onboarding should explain field types by job, not by database vocabulary.

- `Text`: short entries like titles, names, and quick answers.
- `Long text`: longer notes, context, instructions, and meeting details.
- `Status`: one current state, like Waiting, Blocked, or Done.
- `Tags`: multiple custom markers on the same record so work can be filtered, routed, and resurfaced from more than one angle.
- `Date`: due dates, event dates, reminders, and anything time-based.
- `Checkbox`: a yes/no marker with an icon.
- `Number`: counts, quantities, scores, and plain numeric values.
- `Currency`: money.
- `Percent`: readiness, progress, or completion.
- `Phone`: contact number only if she is allowed to store it.
- `URL`: links.
- `Linked record`: connects this record to another table.
- `Lookup`: shows a value from something linked.
- `Count`: counts linked records.
- `Rollup`: summarizes linked records.

Sundesk Lab teaches these more deeply.

### Onboarding Action Spine

The first flow should include these action steps:

- open Today.
- open Build.
- open one record.
- find the table tabs.
- link one fake record.
- add or inspect one tag.
- save or inspect one view.
- export one meeting note PDF.
- open Sundesk Lab.

## Sundesk Lab

Sundesk Lab is a permanent screen.

It is not Help. It is the practice area.

Sundesk Lab uses fake GTA-style sample data. It should be useful and a little funny without making the product feel like a joke.

Possible fake data:

- Danforth Night Market.
- Scarborough Pop-Up.
- Kensington Permit Follow-up.
- Liberty Village Sponsor Check.
- Etobicoke Venue Risk.
- Parkdale Vendor List.
- North York Meeting Prep.
- Mississauga Food Hall.

No real Lindsay data. No SALTXC data. No private contact data. No permit contents. No COI contents. No contract text.

### Lab Progress

Each module stores:

- not started.
- in progress.
- done.
- current step.
- completed action ids.
- last opened timestamp.

Each module shows:

- Continue.
- Start over.
- Reset sample data.

Start over resets module progress. It does not erase her real workspace.

Reset sample data resets the sample workspace only.

### Lab Module Groups

#### 1. Get Oriented

- What Today does.
- What Build does.
- What a table is.
- What a record is.
- What a field is.
- What a linked record is.

#### 2. Build The Workspace

- Build a table.
- Add fields.
- Pick field types.
- Use checkbox swatches and icons.
- Add custom tags.
- Add records.
- Link records.
- Open the record drawer.

#### 3. Work Like A Power User

- Filter.
- Sort.
- Group.
- Colour.
- Save a view.
- Pin a view.
- Use Timeline.
- Read the graph.
- Use rules.
- Export CSV.
- Export meeting note PDF.
- Route a tag from Today back to Build.

#### 4. Meetings

- Open a meeting.
- Review linked work.
- Add notes.
- Read blockers and next steps.
- Export the meeting note PDF.
- Send Josh the template for tuning.

#### 5. Safety

- What not to store.
- Local vs shared data.
- What Firebase writes mean.
- Export backup.
- Import backup.
- When to ask Josh before changing the structure.

#### 6. Tags And Routing

- Add multiple custom tags to one record.
- Create a new tag by typing it.
- Reuse that tag on another record.
- Filter Build by tag.
- Surface a useful tag in Today.
- Click the tag from Today to open Build filtered to that tag.
- Use a tag in a saved view.
- Use a tag in a rule.

## Tags System

Tags are a real product system, not decoration.

A tag field is a multi-value field. A record can have several tags at once.

Example tags:

- `waiting on Steph`
- `ask Josh`
- `venue issue`
- `invoice`
- `sponsor weirdness`
- `call back`

Implementation rules:

- tags live inside the table field they belong to.
- no global tag system for V1.
- type-to-create adds a new option to that tag field.
- tag options persist on the field.
- record tag values persist as string arrays.
- grid, drawer, modal, backup, CSV, and Firestore preserve tag options and values.
- tag filters support contains-tag logic.
- rules support contains-tag logic.
- saved views can filter by tag.
- Timeline can filter by tag.
- Meetings can show tags on linked work when tags explain why the row matters.
- Today can surface useful tags as route chips.
- clicking a tag chip in Today opens Build filtered to that tag.

Custom tags are how Lindsay marks work in her own language without redesigning the table.

## Checkbox Icon And Swatch QA

Checkbox fields support icons and colours.

The UI should show swatches, not colour names.

Requirements:

- internal colour ids are okay.
- user-facing colour labels are not needed.
- check, star, heart, thumb, and flag render distinctly.
- flag icon must be specifically tested.
- selected icon state is obvious.
- selected swatch state is obvious.
- swatches use a polished palette, not generic defaults.
- swatches have enough contrast in every theme.
- grid, field modal, record drawer, and mobile views render checkbox icons consistently.
- mobile tap targets stay at least 44px.

## Help And Issue Surfacing

Help is separate from Sundesk Lab.

Help is for finding answers when she is stuck.

It should include:

- local search.
- synonym tags.
- troubleshooting cards.
- `I'm trying to...` categories.
- links to matching Sundesk Lab modules.
- links to exact screens.

Example issue:

Search: `lost task`

Results:

- Clear filters in Build.
- Check active table.
- Check saved views.
- Open the record drawer.
- Restore from backup if needed.
- Practice module: Records and linked records.

No AI is required.

## Meeting Notes PDF Export

Meeting export is PDF only for Lindsay-facing use.

Do not expose Markdown.

Export should include:

- meeting title.
- date.
- linked communities.
- linked work.
- blockers.
- waiting items.
- agenda.
- next steps.
- notes.

Output:

- local PDF download.
- no email send.
- no AI.
- no remote write.

## RuPaul Mode

RuPaul Mode is a system-wide copy mode.

It applies to the entire app:

- navigation.
- screen headings.
- empty states.
- onboarding.
- Sundesk Lab.
- Help.
- tooltips.
- Settings copy.
- Today copy.
- Build copy.
- record drawer copy.
- meeting copy.
- backup/import/export copy.
- warnings.
- toasts.
- buttons where safe.
- field/helper text where safe.

Implementation must use a copy map, not random inline jokes.

Each mapped string should include:

- plain copy.
- what the user must understand.
- action that happens next.
- RuPaul Mode copy.
- safety level.

Safety levels:

- `free-camp`: headings, empty states, module intros.
- `guided-camp`: onboarding instructions, help, non-destructive tooltips.
- `literal-action`: delete, import, export, reset, write settings, destructive confirmations.

Critical actions stay understandable.

Plain copy reveal:

- Desktop hover after 500ms.
- Mobile long press after roughly 500ms.
- Tooltip shows only the plain copy. No `Original:` prefix.

Settings row:

- title: `RuPaul Mode`.
- subtext: `Long hover shows plain version.`
- toggle syncs across desktop and mobile once shared settings are active.
- visual treatment can use a subtle pink/gold/gloss accent when on.
- no extra label chip.

Tone:

- funny because it is specific.
- useful before it is vulgar.
- camp host energy.
- runway framing.
- quick reads.
- bawdy when safe.
- no direct stolen catchphrase map.
- no random `werk` spam.

Plain mode is not boring mode. It is warm Josh-to-Lindsay copy.

RuPaul Mode is not confusing mode. It is the same instruction with more theatre.

## iPhone PWA Pass

The onboarding and Lab work require a dedicated iPhone pass.

Check:

- safe-area top and bottom spacing.
- bottom navigation tap targets.
- hosted icon on Add to Home Screen.
- iPhone Safari install path.
- Google login flow.
- full-screen record drawer.
- Build grid horizontal scroll.
- long-press plain-copy reveal.
- onboarding overlay fit.
- Sundesk Lab module cards.
- meeting PDF export button.
- PDF download/open behaviour in iOS Safari.
- no text overlap.
- Today remains home.
- Build remains reachable.

## Build Order

Recommended order:

1. Meeting note PDF export.
2. Onboarding data model and synced progress shape.
3. First-run guided onboarding overlay.
4. Exact target-click advancement and action verification.
5. Field type surface explanation inside onboarding.
6. Custom tag creation and tag routing.
7. Checkbox flag icon and swatch QA.
8. Sundesk Lab data model and sample workspace separation.
9. First Sundesk Lab modules: table, record, field, tag, linked record, view.
10. Lab progress sync and Start over.
11. Help search and issue cards.
12. RuPaul Mode copy system and Settings toggle.
13. RuPaul copy map for onboarding and Lab.
14. RuPaul copy map for the rest of the app.
15. iPhone PWA pass.
16. Firebase-backed sync smoke with fake data after write approval.

## Build-Ready Checklist

Before implementation starts:

- Decide whether Sundesk Lab appears in the sidebar or inside Help. Recommended: sidebar.
- Decide whether sample workspace is read-only by default or editable in Lab. Recommended: editable in Lab, resettable, separate from real workspace.
- Define the first 6 Lab modules.
- Define the first-run onboarding copy in plain mode.
- Define exact onboarding targets and action events.
- Define meeting PDF template fields.
- Define shared settings shape for onboarding, Lab, Help, RuPaul Mode, and sample workspace state.
- Define custom tag option persistence and Today tag route behaviour.
- Verify checkbox flag icon and swatch rendering.
- Add E2E coverage for desktop and iPhone-sized viewport.
- Add tests that prove no AI calls exist.
- Add tests that prove no Firebase writes occur until the write gate is enabled.
