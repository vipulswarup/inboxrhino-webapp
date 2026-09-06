import { ConsoleProviders } from '../console-providers';
import { pageMeta } from '../lib/seo';

export const metadata = {
  ...pageMeta(
    '/login',
    'Sign in to InboxRhino — test inbox console',
    'Sign in to the InboxRhino console to create API keys, inspect received test email, and manage inboxes for signup, OTP and password-reset automation.',
  ),
  robots: { index: false, follow: true },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <ConsoleProviders>{children}</ConsoleProviders>;
}
