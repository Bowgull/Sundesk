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

- Themes must feel materially different at the app-shell level, not only through accent buttons.
- Background, rail, panels, cards, chips, focus rings, and hero treatments all move with the selected theme.
- Display typography can move by theme. Build typography stays stable.
- Colour, type, surfaces, states, and contrast are part of the build path while features are built.
- Use semantic tokens first. Raw palette values should stay in theme definitions or justified component states.
- Each theme needs its own surface logic. Light themes can use white space. Dark themes need raised navy surfaces and muted text, not black plus white.
- Dramatic does not mean illegible. Contrast, row scanning, and Build grid clarity win.
- The daily cockpit gets expressive warmth.
- Tables stay calm and legible.
- Status colors must mean something.
- Yellow is waiting or due soon.
- Coral is fire or blocked.
- Blue is informational.
- Green is on track.
- Lavender is meeting prep or build mode.
- Focus Dark is for focus. It can still feel decisive.
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
- UI font.
- Display font.
- Label font.
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
