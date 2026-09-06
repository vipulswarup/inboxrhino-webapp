import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { ConsoleHome } from './console-home';
import { ConsoleProviders } from './console-providers';
import { MarketingHome } from './marketing-home';
import { SiteFrame } from './site-frame';
import { isConsoleHost } from './lib/site';
import { pageMeta } from './lib/seo';

export const metadata: Metadata = pageMeta(
  '/',
  'InboxRhino — real inboxes for signup, OTP and password-reset tests',
  'Create a real MX inbox, catch signup verification, OTP and password-reset email in automated tests, and open the HTML in the browser. Free tier is live. INR billing is coming.',
);

export default async function HomePage() {
  if (isConsoleHost((await headers()).get('host'))) {
    return (
      <ConsoleProviders>
        <ConsoleHome />
      </ConsoleProviders>
    );
  }

  return (
    <SiteFrame>
      <MarketingHome />
    </SiteFrame>
  );
}
