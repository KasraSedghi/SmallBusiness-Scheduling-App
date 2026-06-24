# The Red Bean — Warm Editorial × Soft-Futurism

Reference DESIGN.md for high-end hospitality utility with precise micro-interactions and structured depth.

## 1. Visual Theme & Atmosphere

Warm Editorial × Soft-Futurism. An elegant juxtaposition of print-journal typography and fluid, hyper-responsive digital layouts. It trades cold, generic corporate tech blocks for organic warmth, high typographic contrast, and tactical layout precision.

Mood: composed, high-end, effortlessly ordered.

## 2. Color Palette & Roles

--bg:              #faf9f6  /* Bone/Warm Cream /
--bg-surface:      #ffffff  / Pure White for depth separation /
--bg-inverse:      #1c1917  / Deep Espresso/Stone 900 /
--text:            #1c1917  / Deep Espresso/Stone 900 /
--text-muted:      #78716c  / Warm Grey/Stone 500 /
--text-inverse:    #f5f5f4  / Soft Alabaster/Stone 100 /
--accent:          #8b0000  / Deep Crimson/The Red Bean /
--accent-muted:    #fca5a5  / Soft Rose 300 /
--border:          #e7e5e4  / Soft Stone 200 */
High contrast warmth. Neutral spaces dominate, allowing the crimson accent to draw focus strictly to active elements and primary call-to-actions.

## 3. Typography Rules

- **Display & Main Headers:** Editorial Serif (`Playfair Display`, fallback `Georgia`). Weight 600. Letter-spacing -1%. Rich, book-printed depth.
- **UI Labels & Data Navigation:** Monospace (`JetBrains Mono`, fallback `monospace`). Tracked wide (`tracking-wider`), uppercase, font size reduced.
- **Body & Controls:** High-legibility Sans (`Geist Sans`, fallback `Inter`). Weight 400/500 for clean functional readability.

Scale: 12 (mono) / 14 (body) / 16 / 20 / 24 / 32 / 48 (display headlines). Mix serif display lines with monospace labels to create immediate structural tension.

## 4. Component Stylings

**Buttons**
- Primary: `--accent` fill, white text, radius 12px (`rounded-xl`), tracking normal, weight 500.
- Interactions: On hover, scales up (`hover:-translate-y-0.5 hover:shadow-md transition-all duration-200`). On click, physical tactile compression (`active:scale-[0.98]`).

**Cards & Panels**
- Glassmorphism architecture: `bg-white/80 backdrop-blur-md border border-stone-200/60 rounded-2xl shadow-sm`.
- Padding must be generous (p-6 to p-8) to respect whitespace.

**Form Fields & Inputs**
- Minimalist line or pill inputs: `bg-stone-50/50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:border-red-900 focus:ring-1 focus:ring-red-900/30 transition-all outline-none`.

**Status Badges**
- Warning states (e.g., understaffed): `bg-rose-50 text-rose-900 border border-rose-100 rounded-full animate-pulse duration-[2500ms]`.

## 5. Layout Principles

- Asymmetric grids balanced by structured, empty gutters.
- Fixed structural sidebars navigating into wide, breathing workspace sheets.
- Monospace metadata flags anchored cleanly in corners to acts as functional layout labels.

## 6. Depth & Elevation

Layered glassmorphism. Depth is achieved via `backdrop-blur` boundaries, micro-thin borders (`border-stone-200/60`), and light drop shadows (`shadow-sm`). Elements float gracefully rather than sticking flatly.

## 7. Do's and Don'ts

**Do**
- Use uppercase monospace text for tracking titles and secondary interactive elements.
- Inject micro-scale feedback (`active:scale-[0.98]`) on tap targets.
- Use explicit warm creams (`bg-stone-50`) instead of default cold grays (`bg-slate-50`).

**Don't**
- Use sharp 0px hard corners; everything must use elegant 12px/16px radii.
- Introduce cold neon tones or secondary primary hues.
- Use plain text links without distinct hover transitions.

## 8. Responsive Behavior

- Dense grid layouts collapse gracefully into single stacked card columns.
- Text tracking increases on smaller mobile viewports for clean optical reading.
- Navigation elements slide dynamically from bottom screen points on mobile layouts.

## 9. Agent Prompt Guide

Bias: Warm editorial serifs, uppercase metadata labels, glassmorphic panels, springy button click scales, and deep crimson focus states.

Reject: Sharp corners, cold neon colors, solid black borders, drop shadows with deep opacities, and unstyled native text inputs.
