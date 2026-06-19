# Red Bean Scheduler

A highly intuitive, mobile-friendly internal scheduling and availability platform custom-built for the team at The Red Bean Annapolis.

## Features

- **Employee Portal**: Securely submit weekly shift preferences and time-off requests
- **Admin Dashboard**: Review pending schedules, audit shift coverage, and publish rosters
- **Automated Reminders**: Sunday morning email dispatches for late submissions
- **Role-Based Access**: Secure authentication with email/password and Google OAuth
- **Real-Time Validation**: Enforce 2-shift minimum and 8-hour minimum per week

## Operating Hours

- **Sunday - Thursday**: 9:00 AM - 9:00 PM
- **Friday - Saturday**: 9:00 AM - 10:30 PM

## Tech Stack

- **Frontend & Backend**: Next.js 16+ (React 19 App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database & Auth**: Supabase (PostgreSQL)
- **Email**: Resend API
- **Authentication**: Email/Password + Google OAuth

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase project
- Resend API key (for email functionality)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env.local
```

Fill in your Supabase and Resend API credentials.

3. Start the development server:

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with brand theme
│   ├── page.tsx            # Role selection portal
│   ├── login/              # Authentication routes
│   ├── availability/       # Employee preference submission
│   ├── admin/dashboard/    # Admin scheduling panel
│   └── api/cron/reminder/  # Weekly email reminders
├── components/             # Reusable UI components
│   ├── ShiftSelector.tsx
│   ├── ShiftCard.tsx
│   ├── AvatarUploader.tsx
│   └── ScheduleCard.tsx
├── utils/                  # Helpers and utilities
│   ├── supabase.ts        # Supabase client
│   └── validation.ts      # Schedule validation logic
└── types/                  # TypeScript type definitions
    └── index.ts
```

## Database Schema

The application uses Supabase PostgreSQL with Row-Level Security (RLS) for:

- User profiles and authentication
- Weekly shift definitions (fixed blocks)
- Schedule submissions with "Pending" status
- Time-off requests
- Audit logs and notifications

## Security

- Strict RLS policies on all tables
- 8+ character minimum password requirement
- Row-level security for multi-user data access
- Secure Google OAuth integration

## Color Theme

- **Deep Crimson**: `#8B2E2E` (Primary)
- **Dark Crimson**: `#6B1E1E` (Dark variant)
- **Coffee Brown**: `#6F4E37` (Secondary)
- **Light Cream**: `#F5E6D3` (Light background)
- **White Cream**: `#FFF8F0` (Lightest background)

## Deployment

This project is optimized for deployment on Vercel or any Node.js hosting platform.

## Contributing

Ensure all TypeScript types are properly defined and follow the architectural patterns outlined in `CLAUDE.md`.

## License

Internal use only - The Red Bean Annapolis
