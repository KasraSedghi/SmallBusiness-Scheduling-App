'use client';

import { useState } from 'react';
import { Clock, Users } from 'lucide-react';

const STATS = [
  { value: '18', label: 'Active Staff' },
  { value: '4', label: 'Pending Approvals' },
  { value: '212', label: 'Filled Hours' },
  { value: '6', label: 'Open Shifts' },
  { value: '94%', label: 'Coverage Rate' },
];

type PreviewView = 'weekly' | 'daily';

export default function LandingHero() {
  const [view, setView] = useState<PreviewView>('weekly');

  return (
    <section className="bg-stone-50">
      <div className="mx-auto flex max-w-5xl flex-col gap-12 px-4 py-16 sm:py-20 lg:py-28">
        {/* Top Region */}
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-serif text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
            The Red Bean Scheduler
          </h1>
          <p className="mt-5 text-base text-stone-600 sm:text-lg">
            Built for a café that never stops moving. Submit availability in
            seconds, let{' '}
            <span className="font-semibold text-red-950">
              Automated Roster Execution
            </span>{' '}
            handle the rest, and trust{' '}
            <span className="font-semibold text-red-950">
              Real-time Coverage Validation
            </span>{' '}
            to catch gaps before they become a problem.
          </p>
        </div>

        {/* Stat Row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-stone-200/60 bg-white/60 p-4 text-center"
            >
              <p className="text-2xl font-bold text-red-950">{stat.value}</p>
              <p className="mt-1 text-xs text-stone-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Shift Preview Panel */}
        <div className="relative overflow-hidden rounded-2xl border border-stone-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-md sm:p-8">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(#1c1917 1px, transparent 1px), linear-gradient(90deg, #1c1917 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
            aria-hidden="true"
          />

          <div className="relative flex flex-col items-center gap-6">
            {/* Segmented control */}
            <div className="inline-flex rounded-xl bg-stone-100 p-1">
              <button
                type="button"
                onClick={() => setView('weekly')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                  view === 'weekly'
                    ? 'bg-red-950 text-white'
                    : 'text-stone-600 hover:bg-stone-200/60'
                }`}
              >
                Weekly Availability View
              </button>
              <button
                type="button"
                onClick={() => setView('daily')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                  view === 'daily'
                    ? 'bg-red-950 text-white'
                    : 'text-stone-600 hover:bg-stone-200/60'
                }`}
              >
                Daily Grid View
              </button>
            </div>

            {/* Field inputs */}
            <div className="flex w-full max-w-md flex-col items-stretch gap-4 sm:flex-row">
              <div className="flex flex-1 items-center overflow-hidden rounded-xl border border-stone-200 bg-stone-50/50">
                <label htmlFor="preview-hours" className="sr-only">
                  Hours per week
                </label>
                <span className="flex items-center justify-center border-r border-stone-200 bg-stone-100 px-3 py-3 text-stone-500">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                </span>
                <input
                  id="preview-hours"
                  type="number"
                  inputMode="numeric"
                  defaultValue={32}
                  className="w-full flex-1 bg-transparent px-3 py-3 text-sm text-stone-800 outline-none"
                />
              </div>
              <div className="flex flex-1 items-center overflow-hidden rounded-xl border border-stone-200 bg-stone-50/50">
                <label htmlFor="preview-staff" className="sr-only">
                  Staff scheduled
                </label>
                <span className="flex items-center justify-center border-r border-stone-200 bg-stone-100 px-3 py-3 text-stone-500">
                  <Users className="h-4 w-4" aria-hidden="true" />
                </span>
                <input
                  id="preview-staff"
                  type="number"
                  inputMode="numeric"
                  defaultValue={6}
                  className="w-full flex-1 bg-transparent px-3 py-3 text-sm text-stone-800 outline-none"
                />
              </div>
            </div>

            {/* Helper line */}
            <p className="w-full max-w-md text-left text-xs text-stone-500">
              8 of 10 shifts filled · 92% coverage this week
            </p>

            {/* CTA */}
            <a
              href="/login"
              className="w-full max-w-md rounded-xl bg-gradient-to-r from-red-950 to-red-900 px-8 py-3 text-center text-sm font-medium text-stone-100 transition-colors duration-200 hover:from-red-900 active:scale-[0.98]"
            >
              Get Started
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
