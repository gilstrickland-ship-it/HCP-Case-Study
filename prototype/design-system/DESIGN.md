# Housecall Pro — Prototype Design System

A small, web-based design system that makes the case-study prototype look and feel
native to the Housecall Pro (HCP) app. Tokens were **extracted from the live,
logged-in HCP app** (`pro.housecallpro.com`) on 2026-07-06 by inspecting computed
styles on real elements, then hand-authored into reusable CSS.

## Files

| File | What it is |
|---|---|
| [`tokens.css`](tokens.css) | CSS custom properties — colors, type, spacing, radii, layout. Import first. |
| [`hcp.css`](hcp.css) | Component classes (buttons, cards, shell, table, badges, banners). |
| [`preview.html`](preview.html) | Live preview: an app-shell replica + a token/component reference. Open in a browser. |
| [`../../02-research/design-reference/`](../../02-research/design-reference/) | Screenshots of the real app (`hcp-home.png`, `hcp-invoices.png`) used as the fidelity target. |

## How to use it in the prototype

```html
<link rel="stylesheet" href="design-system/tokens.css">
<link rel="stylesheet" href="design-system/hcp.css">
<!-- Roboto + Open Sans from Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">

<body class="hcp"> ... </body>
```

Reference tokens with `var(--hcp-*)` and compose components with the `.hcp-*`
classes. See `preview.html` for a working example of the full shell.

## What makes it read as "Housecall Pro"

These are the details that carry the resemblance. Get these right and a screen
reads as HCP even before the content matches:

1. **Primary blue `#0E6FBE`** — the single most-used brand color (79 element uses).
   Buttons, links, active nav, icons.
2. **Pill buttons with lowercase text** — buttons are fully rounded
   (`border-radius: 200px`) and use `text-transform: lowercase` ("+ create", not
   "+ Create"). This is HCP's most distinctive and most-copied-wrong quirk.
3. **Flat surfaces** — white cards on a `#FAFAFA` page, thin `#E0E0E0` borders,
   almost no shadow. HCP leans on borders, not elevation.
4. **Roboto body / Open Sans buttons** — the app is Material UI (MUI) under the
   hood; body text is Roboto, buttons/some UI use Open Sans.
5. **Active nav** — light blue tint background (`#DEF0FF`) + blue text + a 3px
   blue inset bar on the left edge.
6. **Uppercase, gray, small table headers** — 11px, `#616161`, letter-spaced.

## Token reference (all extracted unless noted)

### Color
| Token | Value | Use |
|---|---|---|
| `--hcp-blue` | `#0E6FBE` | primary buttons, links, active state |
| `--hcp-blue-tint` | `#DEF0FF` | selected/info background, active nav |
| `--hcp-blue-faint` | `#F1F5FF` | AI-team banner background |
| `--hcp-purple` | `#623CC9` | Pipeline "premium" accent |
| `--hcp-amber` | `#FFB706` | trial/notice banner |
| `--hcp-orange` | `#EF9159` | avatar / warm accent |
| `--hcp-text` | `#212121` | primary text |
| `--hcp-text-secondary` | `#616161` | secondary text |
| `--hcp-slate` | `#263238` | logo, strong headings |
| `--hcp-bg` | `#FAFAFA` | app background |
| `--hcp-surface` | `#FFFFFF` | cards, topbar, sidebar |
| `--hcp-border` | `#E0E0E0` | card/table borders |

### Semantic status (derived, not extracted)
The trial account only had a single *paid* invoice, so status colors could not all
be sampled from the live app. These are chosen to match HCP/MUI conventions and are
labeled `derived` in `tokens.css`. **Swap in exact values if the team shares the
real status palette.**

| State | Text | Background |
|---|---|---|
| Paid | `#2E7D32` | `#E6F4EA` |
| Overdue | `#C62828` | `#FDECEA` |
| Due soon | `#B26A00` | `#FFF4E0` |
| Sent | `#0E6FBE` | `#DEF0FF` |
| Draft | `#616161` | `#EEEEEE` |

### Type scale
Body 13px / line-height 1.43 · h3 21px · h2 26px · headings `font-weight: 400`
(HCP headings are regular weight, not bold) · links & buttons `600`.

### Radii
`4px` inputs/chips · `8px` cards · `200px` buttons (pill) · `50%` avatars.

### Spacing
8px base (MUI): `4 / 8 / 12 / 16 / 24 / 32`.

### Layout
Topbar `65px` · sidebar `232px` · nav rows `40px` tall, `24px` horizontal padding.

## Honesty notes (for the panel)

- Colors, fonts, radii, and layout metrics are **measured from the live app**, not
  guessed. The extraction script is preserved in the session scratchpad; the raw
  screenshots are in `02-research/design-reference/`.
- Status-badge colors and hover/pressed button shades are **derived** (labeled as
  such) because the trial account didn't expose live examples.
- This is a **look-and-feel replica for a prototype**, hand-authored from observed
  values. It does not copy HCP's proprietary stylesheets or component code.
