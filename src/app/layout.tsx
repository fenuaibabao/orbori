import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/lib/auth';
import { SyncProvider } from '@/lib/sync-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Orbori · Where the stars agree',
  description: 'Western, Vedic, Chinese, Numerology, Mayan, Hawaiian and Islamic astrology in one Cosmic Council.',
};

export const viewport: Viewport = {
  themeColor: '#060528',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="sky min-h-dvh"><AuthProvider><SyncProvider>{children}</SyncProvider></AuthProvider></body>
    </html>
  );
}
