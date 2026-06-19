'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-bean to-dark-crimson">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white-cream mb-4">
          Red Bean Scheduler
        </h1>
        <p className="text-lg text-light-cream mb-8">
          Intuitive scheduling and availability platform
        </p>

        <div className="space-y-4">
          <Link
            href="/login"
            className="block px-8 py-3 bg-white-cream text-red-bean font-semibold rounded-lg hover:bg-light-cream transition"
          >
            Login
          </Link>
          <Link
            href="/availability"
            className="block px-8 py-3 bg-coffee-brown text-white-cream font-semibold rounded-lg hover:bg-opacity-90 transition"
          >
            Submit Availability
          </Link>
          <Link
            href="/admin/dashboard"
            className="block px-8 py-3 bg-light-cream text-red-bean font-semibold rounded-lg hover:bg-opacity-90 transition"
          >
            Admin Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
