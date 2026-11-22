import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { CookieConsent } from './cookie-consent';
import { SITE_ORIGIN } from './lib/site';
import { pageMeta } from './lib/seo';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  ...pageMeta(
    '/',
    'InboxRhino — real inboxes for signup, OTP and password-reset tests',
    'Create a real MX inbox, catch signup verification, OTP and password-reset email in automated tests, and open the HTML in the browser. Free tier is live.',
  ),
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
