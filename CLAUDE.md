# The Red Bean Scheduler

## What this project does
A highly intuitive, mobile-friendly internal scheduling and availability platform custom-built for the team at The Red Bean Annapolis. Employees can securely submit their weekly shift preferences and time-off requests, subject to strict weekly hour limits and hard deadlines. Administrative dashboards allow the non-tech-savvy business owners to easily review pending schedules, audit shift coverage, handle automatic email reminders for late submissions, and publish the final week's roster.

## Tech stack
- Frontend & Backend: Next.js (React 19 App Router), TypeScript, Tailwind CSS
- Database & Authentication: Supabase (PostgreSQL) + Email/Password + Google OAuth
- Core Integrations: Resend API (for automated email dispatches via Background Cron Jobs)

## Core Business & Operational Rules
- Operating Hours: Sun-Thu (9:00 AM - 9:00 PM), Fri-Sat (9:00 AM - 10:30 PM)
- Minimum Requirements: Employees must work at least 2 shifts AND at least 8 hours total per week.
- Shift Structure: Fixed blocks of time.
- Schedule Submission Deadline: Locked automatically every Sunday morning at 10:00 AM.
- Content Approval: Employee inputs are set to "Pending" and must be approved by an Admin.
- Brand Theme Colors: Dark Modernist SaaS — Obsidian/Black base, Charcoal/Zinc surfaces, with brightened Red Bean Crimson and shift-block accents (orange/teal/rose) as the vibrant highlight family.

## Key commands
- `npm run dev` — Start the Next.js development server
- `npm run build` — Run production build checks
- `npm run lint` — Audit code quality and Tailwind rules

## Project structure
src/
  app/                 # Next.js App Router (Pages, Layouts, API Routes)
    layout.js          # Core brand theme wrapper
    page.js            # Initial role selection portal
    login/             # Secure email/password and Google entry point
    availability/      # Mobile-friendly employee preference form
    admin/dashboard/   # Intuitive scheduling panel for business owners
    api/cron/reminder/ # Sunday morning automated email dispatch loop
  components/          # Reusable UI cards, shift selectors, and avatar uploaders
  utils/               # Supabase clients and algorithmic verification helpers

## Conventions
- Default to Next.js Server Components; explicitly use 'use client' only for active state-driven inputs.
- All system APIs must return JSON payloads matching the `{ data, error }` pattern.
- Always check that any user-facing layout uses tailwind classes mirroring our custom cafe palette.
- Enforce strict database protection using Supabase Row-Level Security (RLS) layers.

## Agent Roles & Architectural Personas
When executing or fanning out sub-tasks for this codebase, align the sub-agent behaviors with these specific domain roles:

1. **Database Architect Subagent**
   - *Responsibility:* Managing the Supabase PostgreSQL schema, relational tables, and row-level security (RLS).
   - *Focus:* Enforcing constraints on fixed shifts, "Pending" status states, and calendar dates.

2. **Security Specialist Subagent**
   - *Responsibility:* Managing Next.js auth routes, Google OAuth account linking, and rate-limiting middleware.
   - *Focus:* Enforcing the strict 8+ character password rule and safeguarding user profiles.

3. **UI/UX Designer Subagent**
   - *Responsibility:* Crafting mobile-first views and components using Tailwind CSS and React state.
   - *Focus:* Building accessible, high-contrast layouts tailored for non-tech-savvy business managers.

4. **Scheduling Logic Subagent**
   - *Responsibility:* Executing backend algorithmic validations on shift arrays and operational data.
   - *Focus:* Ensuring every submitted schedule complies with the strict 2-shift, 8-hour weekly minimum.

5. **Notification Dispatcher Subagent**
   - *Responsibility:* Handling automated cron-job execution, Resend API integrations, and email triggers.
   - *Focus:* Running the Sunday 10:00 AM grace-period check to flag and email unsubmitted employees.

## boiler plate architecture
   the-red-bean-scheduler/
├── src/
│   ├── app/                    # Next.js App Router (Pages & APIs)
│   │   ├── layout.tsx          # Core theme configuration, Global Tailwind, Fonts
│   │   ├── page.tsx            # Portal selection screen (Employee vs Admin routing)
│   │   ├── login/
│   │   │   └── page.tsx        # Secure Email/Password & Google OAuth gate
│   │   ├── availability/
│   │   │   └── page.tsx        # Mobile-friendly employee shift input & time-off requests
│   │   ├── admin/
│   │   │   └── dashboard/
│   │   │       └── page.tsx    # Clean visual roster panel for non-tech-savvy managers
│   │   └── api/
│   │       ├── auth/callback/  # Required endpoint to handle Google OAuth login redirection
│   │       ├── availability/   # API to handle pending shift submission writes
│   │       ├── admin/          # API for shift approval and master schedule publishing
│   │       └── cron/reminder/  # Automated Sunday morning grace-period email script
│   ├── components/             # Reusable UI pieces
│   │   ├── ui/                 # Small atomic elements (buttons, inputs, dropdowns)
│   │   ├── layout/             # Shared wrappers (mobile navbar, header)
│   │   └── modules/            # Domain blocks (shift picker, calendar preview grid)
│   ├── utils/
│   │   ├── supabase/           # Server and Client side database connection initializers
│   │   └── helpers/            # 2-shift, 8-hour constraint checking math logic
│   └── types/                  # Shared TypeScript type interfaces (Employee, Shift, Request)
├── .env.local
├── .env.example
├── .gitignore
├── CLAUDE.md
└── package.json