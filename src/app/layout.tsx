import type { Metadata } from 'next';
import { Playfair_Display } from 'next/font/google';
import './globals.css';

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-playfair',
  display: 'swap',
});

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
    <html lang="en" className={playfairDisplay.variable}>
      <body className="bg-white-cream text-gray-900 font-sans">
        {children}
      </body>
    </html>
  );
}
