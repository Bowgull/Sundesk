# Sundesk Lab Operations Simulator Design

Status: approved for local implementation.

## Product Rule

Sundesk Lab is not Help.

Sundesk Lab is a working practice simulator. Lindsay learns by changing fake records, reading the result, and seeing the receipt.

## References Used

- Sundesk training deck notes: full app screens, dark navy training rail, small click-path guidance, dense where useful.
- Sundesk onboarding plan: onboarding teaches the spine, Lab teaches the machine.
- CereBro UX rule: the user and agents look at the same evidence.
- GitHub Skills: real workflow in a copy of a real project, guided feedback.
- CodeHS Sandbox: sandbox work starts from templates and stays separate from exercises.
- CodeTeach and Learn2Code: small checks, immediate feedback, active work.
- Obsidian Map View: source records become interactive spatial surfaces with filters, edit mode, paths, and visible state.

## Architecture

The Lab screen becomes an operations simulator with 3 layers.

1. Stage.
   The stage owns the screen. It shows fake records, places, Today lanes, meetings, timeline, and sync boundary. The user acts directly on this surface.

2. Coach.
   The coach shows the current objective, checks, and completion state. It does not do the work for the user.

3. Inspector.
   The inspector shows sync readiness, fake-data boundary, selected view, selected filter, record count, and latest receipt.

## Interaction Rules

- Every lesson action appears on the relevant sandbox surface.
- Detached action buttons are removed from the coach.
- Completion stays blocked until required fake-state checks pass.
- Fake Lab records stay separate from real workspace records.
- Local persistence stays active.
- Firebase writes stay gated.
- Phone layout uses stacked simulator sections and a bottom-style coach block.

## Visual Rules

- First viewport shows the working sandbox.
- The rail becomes compact.
- The stage uses a dark operations-room frame.
- Data remains readable.
- Cards are only used for records, checks, and small repeated items.
- No tiny nested app.
- No inert controls.

## Acceptance

- Desktop at 1366 x 768 shows active sandbox records without scrolling.
- Phone shows mission switcher, stage, coach, and inspector in a usable order.
- User can complete the Tags lesson from visible controls on the stage.
- Reload preserves progress.
- Reset clears Lab state and restores fake records.
- `npm run lint`, `npm run test`, and `npm run build` pass before handoff.
