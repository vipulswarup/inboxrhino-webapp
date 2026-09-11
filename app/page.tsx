import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { MarketingHome } from './marketing-home';
import { SiteFrame } from './site-frame';
import { isConsoleHost } from './lib/site';
import { pageMeta } from './lib/seo';

const marketingMeta = pageMeta(
  '/',
  'InboxRhino — real inboxes for signup, OTP and password-reset tests',
  'Create a real MX inbox, catch signup verification, OTP and password-reset email in automated tests, and open the HTML in the browser. Free tier is live.',
);

export async function generateMetadata(): Promise<Metadata> {
  if (isConsoleHost((await headers()).get('host'))) {
    return {
      title: { absolute: 'InboxRhino console' },
      robots: { index: false, follow: false },
    };
  }
  return marketingMeta;
}

export default async function HomePage() {
  if (isConsoleHost((await headers()).get('host'))) {
    const { ConsoleRoot } = await import('./console-root');
    return <ConsoleRoot />;
  }

  return (
    <SiteFrame>
      <MarketingHome />
    </SiteFrame>
  );
}
