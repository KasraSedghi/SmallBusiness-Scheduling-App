'use client';

import { useState } from 'react';
import { Calendar, Clock, MapPin, ArrowRight } from 'lucide-react';

interface SessionCard {
  dayName: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  title: string;
  type: 'shift' | 'event';
  avatarCount?: number;
  tags?: string[];
}

const DAYS = [
  { label: 'Mon, Oct 27' },
  { label: 'Tue, Oct 28' },
  { label: 'Wed, Oct 29' },
  { label: 'Thu, Oct 30' },
  { label: 'Fri, Oct 31' },
  { label: 'Sat, Nov 1' },
  { label: 'Sun, Nov 2' },
];

const SESSIONS: SessionCard[] = [
  {
    dayName: 'Mon',
    date: '27',
    startTime: '7:00 AM',
    endTime: '3:00 PM',
    venue: 'Front Counter',
    title: 'Morning Counter Shift',
    type: 'shift',
    avatarCount: 3,
  },
  {
    dayName: 'Mon',
    date: '27',
    startTime: '11:00 AM',
    endTime: '7:00 PM',
    venue: 'Espresso Bar',
    title: 'Midday Espresso Bar',
    type: 'shift',
    avatarCount: 2,
  },
  {
    dayName: 'Tue',
    date: '28',
    startTime: '9:00 AM',
    endTime: '9:30 AM',
    venue: 'Break Room',
    title: 'Staff Break',
    type: 'event',
    tags: ['Coffee', 'Pastries'],
  },
  {
    dayName: 'Tue',
    date: '28',
    startTime: '3:00 PM',
    endTime: '9:00 PM',
    venue: 'Front Counter',
    title: 'Evening Counter Shift',
    type: 'shift',
    avatarCount: 4,
  },
  {
    dayName: 'Wed',
    date: '29',
    startTime: '10:00 AM',
    endTime: '12:00 PM',
    venue: 'Patio',
    title: 'Community Tasting Event',
    type: 'event',
    tags: ['Sponsors/Partners:', 'Local Roasters Co.'],
  },
  {
    dayName: 'Thu',
    date: '30',
    startTime: '7:00 AM',
    endTime: '3:00 PM',
    venue: 'Espresso Bar',
    title: 'Morning Espresso Bar',
    type: 'shift',
    avatarCount: 2,
  },
  {
    dayName: 'Fri',
    date: '31',
    startTime: '3:00 PM',
    endTime: '10:30 PM',
    venue: 'Front Counter',
    title: 'Friday Late Shift',
    type: 'shift',
    avatarCount: 5,
  },
  {
    dayName: 'Sat',
    date: '1',
    startTime: '9:00 AM',
    endTime: '10:30 PM',
    venue: 'Front Counter',
    title: 'Weekend All-Day Coverage',
    type: 'shift',
    avatarCount: 6,
  },
];

export default function ScheduleSection() {
  const [activeDay, setActiveDay] = useState(0);

  return (
    <section className="bg-stone-50">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:py-20 lg:py-24">
        {/* Header */}
        <h2 className="text-center font-serif text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
          This Week&apos;s Schedule
        </h2>

        {/* Day Navigation */}
        <div className="mt-8 flex justify-center overflow-x-auto">
          <div className="flex gap-2 px-1 sm:flex-wrap sm:justify-center">
            {DAYS.map((day, index) => {
              const isActive = index === activeDay;
              return (
                <button
                  key={day.label}
                  type="button"
                  onClick={() => setActiveDay(index)}
                  className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'border-red-950 text-red-950'
                      : 'border-transparent text-stone-500 hover:text-stone-700'
                  }`}
                >
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Session Cards Stack */}
        <div className="mt-10 flex flex-col gap-4">
          {SESSIONS.map((session, index) => (
            <div
              key={`${session.title}-${index}`}
              className="flex flex-col gap-4 rounded-xl border border-stone-200/60 bg-white/70 p-5 shadow-sm backdrop-blur-md sm:flex-row sm:gap-6"
            >
              {/* Date Column */}
              <div className="flex shrink-0 flex-row items-center gap-2 sm:w-16 sm:flex-col sm:items-start sm:gap-0">
                <p className="font-mono text-xs uppercase tracking-wider text-stone-500">
                  {session.dayName}
                </p>
                <p className="font-mono text-2xl font-bold text-stone-900">
                  {session.date}
                </p>
              </div>

              {/* Details Column */}
              <div className="flex shrink-0 flex-col gap-1 sm:w-44">
                <div className="flex items-center gap-1.5 text-sm text-stone-600">
                  <Clock className="h-3.5 w-3.5 text-stone-400" aria-hidden="true" />
                  <span>
                    {session.startTime} &ndash; {session.endTime}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-stone-500">
                  <MapPin className="h-3.5 w-3.5 text-stone-400" aria-hidden="true" />
                  <span>{session.venue}</span>
                </div>
              </div>

              {/* Content Column */}
              <div className="flex flex-1 flex-col gap-2">
                <a
                  href="#"
                  className="text-base font-semibold text-stone-900 transition-colors duration-200 hover:text-red-950 hover:underline"
                >
                  {session.title}
                </a>

                {session.type === 'shift' && session.avatarCount ? (
                  <div className="flex -space-x-2">
                    {Array.from({ length: session.avatarCount }).map((_, avatarIndex) => (
                      <div
                        key={avatarIndex}
                        className="h-8 w-8 rounded-full border-2 border-white bg-stone-300"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                    {session.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-stone-200/60 bg-stone-100 px-2.5 py-1"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-10 text-center">
          <a
            href="#"
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-red-950 underline decoration-transparent decoration-2 underline-offset-4 transition-all duration-200 hover:decoration-red-950"
          >
            View Full Schedule
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </a>
        </div>
      </div>
    </section>
  );
}
