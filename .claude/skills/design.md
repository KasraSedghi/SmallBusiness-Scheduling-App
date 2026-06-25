# Skill: Real-Time UI Alignment & Design Inspiration Tracker

## Context & Execution Model
The AI Agent must read and reference this design skill whenever a frontend file (`.tsx`, `.ts`, `.css`) is created, modified, or refactored. This file serves as the strict layout blueprint for "The Red Bean Scheduler," translating structural patterns into pixel-perfect code layouts using Tailwind CSS and Lucide React icons.

---

## 1. Structural Paradigm: The Roster Landing Hero
When constructing or updating a hero section, the layout must follow this precise vertical stacking architecture:

* **Container:** Single full-width section backdrop using `--bg` (`bg-stone-50`). Horizontally centered container with a bounded max-width and generous vertical padding that dynamically scales up across responsive breakpoints (`py-12 md:py-24 lg:py-32`).
* **Top Region Column (Max width: 672px):** - Large center-aligned heading on its own line set in our Editorial Serif (`font-serif`), using a heavy weight (`font-bold`), tight letter-spacing (`tracking-tight`), and fluid type scaling.
  - Centered supporting paragraph directly beneath it at a comfortable reading length. High-contrast keywords must be wrapped in `font-semibold text-red-950`.
* **Stat Row Metric Grid:** - Positioned directly below the top region. A single horizontal row of five equal-width metric cards sharing a uniform baseline and layout gap (`gap-4`).
  - Card Anatomy: Compact outlined containers (`backdrop-blur-md bg-white/60 border border-stone-200/60 rounded-xl p-4`). Prominent numeric value on its own line on top, short descriptive utility label directly beneath it. Both texts must use a high-contrast crimson tint (`text-red-950`).
  - Mobile Behavior: Automatically reflows into a 2-column wrapped grid layout.
* **The Shift Preview Converter Panel:**
  - Placed directly below the stat row. One large full-width centered panel (`rounded-2xl border border-stone-200/60 shadow-sm bg-white/80 backdrop-blur-md p-6 md:p-8`).
  - Texturing: Layer a low-opacity geometric grid or subtle noise canvas behind the inner content.
  - Segmented Control Switch: A centered, two-option tab selection rule managed via a React `useState` toggle. Active selection holds a deep crimson fill with white text; inactive item uses a clean background-fade hover state.
  - Field Groups: Centered, width-bounded region containing two side-by-side input fields sharing a baseline and gap. Inputs use an integrated Lucide icon as a leading affix flush to the left edge of a numeric input with a shared rounded outline boundary.
  - Call to Action: Single primary CTA button centered at the base executing a smooth hover transition and tactile click scale down (`hover:-translate-y-0.5 active:scale-[0.98] transition-all`).

---

## 2. Structural Paradigm: Tactical Shift & Event Schedule
When building or modifying timetable matrices, scheduling grids, or calendars, execute this exact interactive structure:

* **Header Selector Tab Bar:** - Large center-aligned display header on its own line. Directly below sits a horizontal row of day-selector tabs on a unified baseline. 
  - Tab Anatomy: Interactive element linking a small leading Lucide `Calendar` icon and a short label on the same baseline. Active selections use a deep crimson highlight indicator; inactive options remain plain.
  - Mobile Behavior: Enforce horizontal overflow scrolling (`overflow-x-auto whitespace-nowrap scrollbar-none`) or clean line-wrapping.
* **Session/Shift Cards Stack (Vertical Layout):**
  - A vertical column of 8 sequential cards with consistent vertical layout spacing (`space-y-4`). 
  - Each card must use our standard glassmorphic panel tokens, mapping content inside a horizontal row split into three distinct spatial columns:
    1. **Date Column:** Left-aligned column displaying an abbreviated day string on top and a large numeric date directly beneath it using clean monospace spacing rules.
    2. **Details Column:** Left-aligned stack. Line 1: Lucide `Clock` icon paired flush with an inline start-end time string. Line 2: Lucide `MapPin` icon paired flush with an inline location station label (e.g., "Espresso Bar").
    3. **Content Column:** The widest column. Contains a left-aligned vertical layout with the main shift title formatted as an interactive underline text link. For staff schedules, render overlapping small circular user profile pictures (`-space-x-2 flex`). For internal notes, render horizontal rows of small utility icons.
* **Mobile Behavior:** The three internal layout columns must stack vertically in reading sequence (Date -> Details -> Content), stretching cards to full content width with comfortable container padding.

---

## 3. Structural Paradigm: 3-Tier Multi-Role Navbar System
When modifying navigation components, output *only* this exact self-contained component structure:

* **Tier 1 (Top Utility Bar):** Full-width secondary surface (`bg-stone-100/60`) with exactly 8px of vertical padding and a micro-thin bottom separator divider line. Starts with contact details (Lucide icons + text) and ends with locale selectors or user authentication router links.
* **Tier 2 (Main Brand Bar):** 16px of vertical padding with a thin bottom divider line. Wraps fluidly with a 16px layout gap on small viewports, changing to a single straight line from the `lg` breakpoint up:
  - Brand Section: Non-shrinking typography logo link (~32px tall).
  - Joined Search Anchor: Central component capped at 560px (hidden below `lg` viewports). Combines a left-rounded category trigger, a middle search field input, and a deep crimson right-rounded search submit button into one seamless outline control.
  - User Action Cluster: Theme-toggles, message counters, and our standalone profile dropdown avatar trigger (~32px circular image). No chevrons may be appended next to the profile avatar or ellipsis overflow buttons.
* **Tier 3 (Secondary Navigation Row):** 10px of vertical padding holding a left-aligned plain text link array separated by an explicit 24px layout gap. Hidden completely on mobile/tablet viewports.
* **Spacing & Glyph Rules:** All icons must match exactly `18px × 18px`. Use an explicit 8px gap between icons and text parameters. Group icon-only targets tightly with a 4px layout gap. Separate labeled components with a 16px layout gap.
* **Mobile Hamburg Trigger Constraint:** Enforce that the hamburger menu toggle icon is hidden on screens wider than 768px via a strict media query rule (`@media (min-width: 768px) { display: none }`) to prevent flex conflicts.

---

## 4. Guardrails: Do's and Don'ts

### Do:
* Mix Editorial Serif display headers with clean uppercase Monospace micro-labels to create intentional structural contrast.
* Apply subtle touch-scaling effects (`active:scale-[0.98]`) to tactile interactive states.
* Keep borders soft, micro-thin, and slightly translucent (`border-stone-200/60`).

### Don't:
* Do not introduce harsh, solid black outline wrappers, drop shadows with deep opacities, or harsh sharp 0px corners.
* Do not use default gray palettes (`bg-slate-50`); always prioritize warm editorial creams (`bg-stone-50`).
* Do not write or include automated UI layout styles or element padding tests unless explicitly instructed.