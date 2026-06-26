# Skill: Red Bean Design System

## Context & Execution Model
Read and apply this skill whenever a frontend file (`.tsx`, `.ts`, `.css`) is created, modified, or refactored. This file is the single description of "The Red Bean Scheduler" visual language: the design tokens that exist, the real page/component structures that exist today, and the rules for extending them consistently. The app was rewritten from a light cream/crimson theme to a **Dark Modernist SaaS** look (Monday.com/Linear-inspired); this version documents that rewrite as the current source of truth — it only documents what is actually in the codebase, so it stays trustworthy as a reference.

---

## 1. Design Tokens (single source of truth)

All brand and semantic colors are declared once, in `src/app/globals.css`, inside the Tailwind v4 `@theme` block. **Never** hardcode raw Tailwind palette classes (`bg-stone-50`, `text-red-900`, `bg-amber-100`, etc.) in a component — use the semantic token below instead. This is what gives the app global theming and a shared vocabulary: change a hex value once in `globals.css` and every page updates.

There is no `tailwind.config.js` — Tailwind v4 reads tokens from CSS. `globals.css` is the only place colors are defined.

### Brand
| Token | Hex | Use for |
|---|---|---|
| `brand` | `#e11d48` | Primary actions, links, active tab state, brand text — brightened crimson against the dark base |
| `brand-deep` | `#9f1239` | Gradient end, hover states |
| `coffee` | `#b08968` | Secondary brand accent (rarely used directly; prefer `ink-*` for text) |
| `cream` | `#f5e6d3` | Warm secondary surface (rare; mostly legacy/portal pages) |
| `cream-white` | `#fff8f0` | Text/labels placed on top of a brand-colored or shift-colored button/surface |

### Neutral — obsidian/zinc dark base (now used app-wide, not just the sidebar)
| Token | Hex | Use for |
|---|---|---|
| `surface` | `#09090b` | Page background (pure obsidian) |
| `surface-muted` | `#18181b` | Cards/panels/wrappers (deep charcoal), table header rows, dropdowns |
| `border` | `#27272a` | Default hairline border/divider, hover-fill target for interactive rows |
| `border-strong` | `#3f3f46` | Hover/emphasized border, unselected glyph color |
| `ink` | `#fafafa` | Headings, primary text |
| `ink-soft` | `#d4d4d8` | Labels, sub-headings, secondary buttons |
| `ink-muted` | `#a1a1aa` | Help text, metadata |
| `ink-faint` | `#71717a` | Placeholder text, least-important meta |

### Dark chrome (admin sidebar — now just a deeper shade of the same dark system)
| Token | Hex |
|---|---|
| `surface-dark` | `#000000` |
| `border-dark` | `#18181b` |
| `ink-on-dark` | `#fafafa` |
| `ink-on-dark-muted` | `#a1a1aa` |

### Status
| Token | Hex | Use for |
|---|---|---|
| `success` | `#22c55e` | Approved badges, success banners, Approve buttons |
| `warning` | `#f59e0b` | Deadline notices, pending badges, holiday-mode banners |
| `danger` | `#f43f5e` | Under-scheduled / compliance-violation badges, Disapprove buttons |
| `caution` | `#fb923c` | Over-scheduled badges |

### Schedule shift-type accents
Used to colour-code the weekly roster and shift pickers by shift block.
| Token | Hex | Use for |
|---|---|---|
| `shift-morning` | `#f97316` | Opening shift (orange) |
| `shift-afternoon` | `#14b8a6` | Midday shift (teal) |
| `shift-evening` | `#fb7185` | Closing shift (rose) |
| `shift-morning-soft` / `shift-afternoon-soft` / `shift-evening-soft` | dark tints | Soft cell/chip fills behind the matching accent text, on the dark base |

These three drive: the admin `RosterGrid` calendar chips + header indicators, the employee `ShiftSelector` selected buttons, and gradient page headings (`bg-clip-text`). Stat-card and heading gradients combine them with `brand` (e.g. `from-brand via-shift-evening to-shift-morning`).

Opacity modifiers work normally on any token: `bg-brand-deep/5`, `border-success/15`, `text-ink-muted` etc.

### `.panel` utility class
A global, non-Tailwind CSS class (defined once in `globals.css`, not a `@theme` token) for the app-wide "card lift" effect: `background-color: var(--color-surface-muted)`, a 1px `var(--color-border)` micro-border, `border-radius: 1rem`, and on `:hover` a stronger border (`border-strong`) plus a layered glow `box-shadow` (subtle white inset ring + deep black drop shadow + a crimson-tinted glow). Use `className="panel ..."` for any card/wrapper instead of repeating `rounded-2xl border border-border bg-surface-muted` by hand — this is what gives every panel the Monday.com/Linear hover lift.

---

## 2. Real Page & Component Structures

### Portal splash (`src/app/page.tsx`)
Full-screen brand gradient (`bg-linear-to-br from-brand-deep to-brand`) with a low-opacity cream radial glow. Centered bean mark in a translucent `bg-cream-white/10` tile, "The Red Bean" title in `cream-white`, and a pulsing loader bar. Error state swaps in an X glyph and a `bg-cream-white` "Go to Login" button.

### Login (`src/app/login/page.tsx`)
**Split-panel** (SaleSkip-inspired). On `lg+`: a left brand `<aside>` (`w-1/2`, `bg-linear-to-br from-brand-deep via-brand to-brand-deep`) holding the logo, headline, pitch, feature checklist, copyright — all `cream`/`cream-white`. The right `w-1/2` panel is the dark `surface` form column: segmented Sign In/Sign Up toggle (active state `bg-border text-ink`), stacked fields on `bg-surface-muted`, gradient brand CTA, divider, Google OAuth button (`hover:bg-border`), footer links.

### Availability (`src/app/availability/page.tsx`)
Sticky header: left side shows email + week label; **right side holds the avatar trigger, permanently pinned to the extreme top-right corner** — clicking it opens a `.panel` dropdown (`absolute right-0 top-full w-64`) containing the compact `AvatarUploader`. Sign Out button transitions `hover:bg-border hover:text-ink-soft active:scale-[0.98]`. Below the header: deadline notice banner → **two-column `lg:grid-cols-2` split** (stacks on mobile), both cards using `panel p-6`. **Left — "Weekly Requirements":** 3 requirement rows (Shifts Selected / Hours / Status) each a tile with an icon circle (`bg-surface-muted`), a `text-4xl font-extrabold` value, unmet-state row background `bg-border/40`; below that, "The Rules" checklist. **Right — "Pick Your Shifts":** `ShiftSelector` + Save button.

### ShiftSelector (`src/components/modules/ShiftSelector.tsx`)
One `<section>` per day, 3 shift-type buttons (morning/afternoon/evening) in `grid-cols-1 sm:grid-cols-3`. Selected state colour-coded by shift type (`border-2 border-shift-* bg-shift-*-soft text-shift-*` + matching checkmark). Unselected: `border-border bg-surface-muted text-ink-soft`, with `hover:border-border-strong hover:bg-border` and `active:scale-[0.98]` tactile compression on click.

### Admin Dashboard (`src/app/admin/dashboard/page.tsx`)
Two-pane layout: a fixed dark sidebar (`w-72`, `surface-dark`/`border-dark`/`ink-on-dark*` tokens) with roomy `text-base font-semibold` nav rows (`py-3.5`) — **Roster Dashboard** (active), **Approvals Queue** (with a `bg-brand` pending-count badge, links to `/admin/approvals`), **Capacity Settings** — plus week summary, Publish button, Sign Out button (`hover:bg-border-dark hover:text-ink-on-dark`, `active:scale-[0.98]`). The main pane has **no page title** — the "Roster Matrix" heading was intentionally removed; the calendar speaks for itself. A **4-up stats overview row** (Submissions / Pending Review / Approved / Coverage) sits at the top, each a gradient hero tile, then `RosterGrid` renders directly beneath it. All gradient/accent classes are written as full static strings (`from-success to-[#166534]`), never interpolated — Tailwind's JIT only sees complete class literals. The approval workflow does **not** live on this page — see Approvals Queue below.

### RosterGrid (`src/components/modules/RosterGrid.tsx`)
A **Monday.com-style horizontal calendar timeline**, not a list of per-employee cards. Opens with a shift colour legend (dot + label per shift type, plus an outline swatch for "Pending"). Below that, a single `.panel overflow-x-auto` wrapping one `<table>`: rows = team members (sticky left-hand `AvatarDisplay` + email + truncated ID column, `sticky left-0 z-10`), columns = the 7 calendar days (Mon–Sun). Each day's `<th>` shows the day label plus a row of three small per-shift **indicator pills** (`actual/required`, soft-tinted by shift type) — hovering/focusing a pill (pure CSS `group`/`group-hover`, no React state) reveals the **Shift Registration Inspector**: a `.panel` overlay listing every employee registered for that exact day+shift slot with an Approved/Pending badge each, plus a `danger`-coloured shortfall line when understaffed. Body cells show that employee's shifts for that day as small chips — solid (`SHIFT_CHIP_CLASSES`) when `approved`, outline/ghost (`SHIFT_CHIP_GHOST_CLASSES`) when `pending` — or a faint dash when empty. There are no Approve/Revert controls anywhere in this component; it is read-only/inspectable, with all mutating actions living in the Approvals Queue.

### Approvals Queue (`src/app/admin/approvals/page.tsx`)
An isolated route (own sidebar nav tab, badge-counted) dedicated solely to the approval workflow. Lists every `pending` availability for the current week as dark-surface `.panel` rows (avatar + email + that submission's shift chips), each with **Approve** (`bg-success`) and **Disapprove** (`border border-danger/40 text-danger`) buttons. Clicking either button immediately marks the row as dismissing (`translate-x-6 opacity-0`, 300ms transition) and fires the corresponding Supabase mutation in the background (`PUT .../availability` with `status: 'approved'` for Approve; `DELETE .../availability` for Disapprove — disapproval removes the row rather than introducing a new status, since the `availabilities.status` CHECK constraint only allows `pending`/`approved`); the row is spliced out of local state once the fade-out finishes. Empty state shows a `success`-tinted "All caught up" panel.

### Admin Capacity (`src/app/admin/capacity/page.tsx`)
`max-w-4xl` settings page using `panel` cards: holiday-override toggle, one card per day with 3 numeric capacity inputs, summary card, Save/Reset/Back actions.

---

## 3. Guardrails: Do's and Don'ts

### Do:
* Reach for a semantic token (`brand`, `ink`, `surface`, `success`, etc.) before reaching for a raw Tailwind palette class. If the color you need doesn't have a token yet, add one to `globals.css` rather than hardcoding a one-off hex/palette class.
* Use the `panel` utility class for any card/wrapper instead of hand-rolling `rounded-2xl border border-border bg-surface-muted` — it carries the standard hover glow/lift.
* Apply subtle touch-scaling effects (`active:scale-[0.98]`) to tactile interactive states (buttons, calendar cells, sign-out).
* Keep borders soft, micro-thin (`border` token, 1px), and let `.panel`'s hover state (`border-strong` + glow shadow) be the only "lift" effect — don't stack extra shadows on top of it.
* Treat `surface`/`surface-muted`/`border` as the *only* base chrome everywhere in the app now — there is no separate light theme to preserve.

### Don't:
* Do not introduce a second color system (this app already paid down a real bug from having two competing palettes; don't repeat that mistake by mixing in light-theme tokens or raw Tailwind grays).
* Do not use default gray palettes (`bg-slate-50`, `text-gray-400`); always use the `ink-*`/`surface-*` tokens instead.
* Do not put Approve/Disapprove/approval-workflow controls back on the main admin dashboard page — that logic belongs exclusively in `src/app/admin/approvals/page.tsx`.
* Do not write or include automated UI layout/pixel tests unless explicitly instructed.
