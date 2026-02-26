import type { Metadata, Viewport } from 'next';
import { Inter_Tight } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/context/ThemeContext';
import './globals.css';

const interTight = Inter_Tight({
  variable: '--font-inter-tight',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Findit - Lost and Found | Babcock University',
  description: 'Report and find lost items on Babcock University campus. A secure platform connecting finders with owners.',
  keywords: ['lost and found', 'Babcock University', 'campus', 'lost items', 'found items'],
  authors: [{ name: 'Findit Team' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Findit',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#003898',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={interTight.variable} suppressHydrationWarning>
      <body className={`${interTight.variable} ${interTight.className} antialiased`}>
        <ThemeProvider>
          <main className="min-h-dvh">{children}</main>
          <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
        </ThemeProvider>
      </body>
    </html>
  );
}
