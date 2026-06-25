# Skill: Red Bean Design System

## Context & Execution Model
Read and apply this skill whenever a frontend file (`.tsx`, `.ts`, `.css`) is created, modified, or refactored. This file is the single description of "The Red Bean Scheduler" visual language: the design tokens that exist, the real page/component structures that exist today, and the rules for extending them consistently. Previous versions of this file described aspirational layouts (hero sections, search-anchor navbars, hamburger menus) that were never built — this version only documents what is actually in the codebase, so it stays trustworthy as a reference.

---

## 1. Design Tokens (single source of truth)

All brand and semantic colors are declared once, in `src/app/globals.css`, inside the Tailwind v4 `@theme` block. **Never** hardcode raw Tailwind palette classes (`bg-stone-50`, `text-red-900`, `bg-amber-100`, etc.) in a component — use the semantic token below instead. This is what gives the app global theming and a shared vocabulary: change a hex value once in `globals.css` and every page updates.

There is no `tailwind.config.js` — Tailwind v4 reads tokens from CSS, and a stale v3-style config file with a different, unused color set used to sit alongside `globals.css`. It has been deleted. `globals.css` is the only place colors are defined.

### Brand
| Token | Hex | Use for |
|---|---|---|
| `brand` | `#7f1d1d` | Primary actions, links, active tab state, brand text |
| `brand-deep` | `#450a0a` | Headings on brand, gradient end, hover states, brand-as-alert (error banners reuse this — see Note below) |
| `coffee` | `#6f4e37` | Secondary brand accent (rarely used directly; prefer `ink-*` for text) |
| `cream` | `#f5e6d3` | Warm secondary surface |
| `cream-white` | `#fff8f0` | Text/labels placed on top of a brand-colored button or surface |

### Neutral (light chrome — login, availability, dashboard main panel, capacity page)
| Token | Maps to | Use for |
|---|---|---|
| `surface` | stone-50 | Page background |
| `surface-muted` | stone-100 | Cards-on-cards, toggle tracks, table header rows |
| `border` | stone-200 | Default hairline border/divider |
| `border-strong` | stone-300 | Hover/emphasized border, unselected glyph color |
| `ink` | stone-800 | Headings, primary text |
| `ink-soft` | stone-700 | Labels, sub-headings, secondary buttons |
| `ink-muted` | stone-500 | Help text, metadata |
| `ink-faint` | stone-400 | Placeholder text, least-important meta |

### Dark chrome (admin dashboard sidebar only)
| Token | Maps to |
|---|---|
| `surface-dark` | stone-900 |
| `border-dark` | stone-800 |
| `ink-on-dark` | stone-100 |
| `ink-on-dark-muted` | stone-400 |

### Status
| Token | Hex | Use for |
|---|---|---|
| `success` | `#15803d` | Approved badges, success banners |
| `warning` | `#78350f` | Deadline notices, pending badges, holiday-mode banners |
| `danger` | `#881337` | Under-scheduled / compliance-violation badges |
| `caution` | `#7c2d12` | Over-scheduled badges |

**Note on error banners:** form-level errors (login, availability) intentionally reuse `brand`/`brand-deep` rather than `danger`. This is a deliberate brand choice already baked into every page — the crimson *is* the alert color here, not a separate red. `danger`/`caution` are reserved for the roster compliance badges in `RosterGrid`, which need to stay visually distinct from "this is brand crimson" so admins can tell a real scheduling violation apart from ordinary brand chrome.

Opacity modifiers work normally on any token: `bg-brand-deep/5`, `border-success/15`, `text-ink-muted` etc.

---

## 2. Real Page & Component Structures

### Portal splash (`src/app/page.tsx`)
Full-screen brand gradient (`bg-linear-to-br from-brand-deep to-brand`) with a low-opacity cream radial glow. Centered bean mark in a translucent `bg-cream-white/10` tile, "The Red Bean" title in `cream-white`, and a pulsing loader bar. Error state swaps in an X glyph and a `bg-cream-white` "Go to Login" button. This is the only crimson-flooded page besides the login brand panel; all text uses `cream-white`/`cream` for contrast.

### Login (`src/app/login/page.tsx`)
**Split-panel** (SaleSkip-inspired). On `lg+`: a left brand `<aside>` (`w-1/2`, `bg-linear-to-br from-brand-deep via-brand to-brand-deep`, decorative concentric `cream-white/10` rings) holding the logo, a "Welcome to The Red Bean 👋" headline, a short pitch, a 3-item feature checklist, and a copyright line — all in `cream`/`cream-white`. The right `w-1/2` panel is a clean `surface` column holding the form. Below `lg`, the brand panel is hidden and a compact centered bean mark (`lg:hidden`) sits above the form instead. Form internals are unchanged: segmented Sign In/Sign Up toggle, stacked fields, gradient brand CTA, divider, Google OAuth button, footer links. Error/success banners reuse `brand`/`success` at low opacity.

### Availability (`src/app/availability/page.tsx`)
Sticky header (avatar/initials, email, week label, Sign Out button) over a `max-w-2xl` column: deadline notice banner (`brand` if passed, `warning` if upcoming) → 3-card stat row (shifts/hours/status), each card topped with an icon tile that turns `bg-success/10 text-success` once that requirement is met (and `bg-danger/10` for an invalid status) → `ShiftSelector` → Save button → avatar uploader → minimum-requirements footer note.

### ShiftSelector (`src/components/modules/ShiftSelector.tsx`)
One `<section>` per day, each rendering 3 shift-type buttons (morning/afternoon/evening) in a `grid-cols-1 sm:grid-cols-3`. Selected state: `border-2 border-brand bg-brand-deep/5 text-brand-deep` + checkmark icon. Unselected: `border-border text-ink-soft`.

### Admin Dashboard (`src/app/admin/dashboard/page.tsx`)
Two-pane layout: a fixed dark sidebar (`surface-dark`/`border-dark`/`ink-on-dark*` tokens — the only place dark chrome is used) with brand mark, an icon **nav** (Roster Dashboard [active] + a `next/link` to Capacity Settings), week summary, Publish button, Sign Out button. The light main panel (`surface`) opens with a **4-up stats overview row** — Submissions / Pending Review / Approved / Coverage — each a white `rounded-2xl` card with a tonal icon tile (`bg-brand/10 text-brand`, `bg-warning/10`, `bg-success/10`, `bg-coffee/10`), big number, label, and hint. `RosterGrid` renders beneath it. **Note:** stat-card accent classes are written as full static strings (`bg-success/10 text-success`), never interpolated (`bg-${x}/10`) — Tailwind's JIT only sees complete class literals.

### RosterGrid (`src/components/modules/RosterGrid.tsx`)
Staffing summary table (shortfalls flagged with `danger`) followed by Pending/Approved sections of per-employee cards. Each card: avatar + email header with status pill (`success`/`warning`) and compliance badge (`danger`/`caution`), then a day×shift matrix with a left **shift-label gutter** (Morning/Afternoon/Evening + time range) and day-column headers; selected cells are solid `bg-brand text-cream-white` blocks (Homebase-style), empty cells a faint `text-border-strong` dash. Footer has shift/hour metrics and an Approve/Revert action.

### Admin Capacity (`src/app/admin/capacity/page.tsx`)
`max-w-4xl` settings page: holiday-override toggle, one card per day with 3 numeric capacity inputs, summary card, Save/Reset/Back actions.

---

## 3. Guardrails: Do's and Don'ts

### Do:
* Reach for a semantic token (`brand`, `ink`, `surface`, `success`, etc.) before reaching for a raw Tailwind palette class. If the color you need doesn't have a token yet, add one to `globals.css` rather than hardcoding a one-off hex/palette class.
* Apply subtle touch-scaling effects (`active:scale-[0.98]`) to tactile interactive states.
* Keep borders soft, micro-thin, and slightly translucent (`border-border/60`).
* Use the dark-chrome tokens (`surface-dark`, etc.) only for the admin sidebar — it's the one intentionally dark surface in the app; every other page is light.

### Don't:
* Do not introduce a second color system (this app already paid down a real bug from having two: a dead `tailwind.config.js` palette and an unused `globals.css` palette, neither of which any page actually used).
* Do not introduce harsh, solid black outline wrappers, drop shadows with deep opacities, or harsh sharp 0px corners.
* Do not use default gray palettes (`bg-slate-50`, `text-gray-400`); always use the warm `ink-*`/`surface-*` tokens instead.
* Do not write or include automated UI layout/pixel tests unless explicitly instructed.
