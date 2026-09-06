import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { GoogleAnalytics } from './google-analytics';
import { AHREFS_ANALYTICS_KEY, SITE_ORIGIN } from './lib/site';
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
    'Create a real MX inbox, catch signup verification, OTP and password-reset email in automated tests, and open the HTML in the browser. Free tier is live. INR billing is coming.',
  ),
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
};

const ahrefsLoader = `var ahrefs_analytics_script = document.createElement('script');
  ahrefs_analytics_script.async = true;
  ahrefs_analytics_script.src = 'https://analytics.ahrefs.com/analytics.js';
  ahrefs_analytics_script.setAttribute('data-key', '${AHREFS_ANALYTICS_KEY}');
  document.getElementsByTagName('head')[0].appendChild(ahrefs_analytics_script);`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN">
      <head>
        <script dangerouslySetInnerHTML={{ __html: ahrefsLoader }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <GoogleAnalytics />
      </body>
    </html>
  );
}
