import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Red Bean Scheduler',
  description: 'Intuitive scheduling and availability platform for The Red Bean Annapolis',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white-cream text-gray-900 font-sans">
        {children}
      </body>
    </html>
  );
}
