import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import RegisterSW from '@/components/pwa/RegisterSW';

export const metadata: Metadata = {
  applicationName: 'TurfSplit',
  title: 'TurfSplit — Turf Booking & Split',
  description: 'Book turf slots, split costs with players, and settle payments — the smart way to run your games.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TurfSplit',
  },
  icons: {
    icon: [
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#0b2b1a',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body className="bg-background text-on-background font-body-md antialiased min-h-screen">
        <AuthProvider>{children}</AuthProvider>
        <RegisterSW />
      </body>
    </html>
  );
}
