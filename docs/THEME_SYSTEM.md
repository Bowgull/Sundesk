# Theme System

Sundesk supports five V1 themes.

## Themes

- `sunrise-soft`
- `sunset-bold`
- `cloud-light`
- `focus-dark`
- `paper-light`

## Source Palette

The logo and palette references define the system:

- Navy.
- Coral.
- Peach.
- Golden yellow.
- Soft blush.
- Cloud blue.
- Muted periwinkle.
- Lavender gray.

## Design Rules

- The daily cockpit gets expressive warmth.
- Tables stay calm and legible.
- Status colors must mean something.
- Yellow is waiting or due soon.
- Coral is fire or blocked.
- Blue is informational.
- Green is on track.
- Lavender is meeting prep or build mode.
- Dark mode is for focus, not drama.
- Sunrise Soft is the default.
- Cloud Light is the cleanest productivity theme.
- Paper Light is neutral, printable, and low-noise.
- Theme selection uses visual swatches, not text-only buttons.
- The selected swatch shows background, surface, text, accent, status chip, and primary button.

## Implementation

Themes are CSS variables.

V1 stores the selected theme in local storage. Firestore `userSettings` can mirror it later.

Each theme defines:

- Background.
- Surface.
- Raised surface.
- Text.
- Muted text.
- Border.
- Accent.
- Fire.
- Waiting.
- Prep.
- Success.
- Focus.
- Shadow.
- Hero gradient.

The app applies the selected theme at the root with `data-theme`.

The full UI/UX polish target lives in [UI/UX Polish Spec](UI_UX_POLISH_SPEC.md).
