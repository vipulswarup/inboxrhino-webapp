import { redirect } from 'next/navigation';
import { pageMeta } from '@/app/lib/seo';

export const metadata = pageMeta(
  '/docs/quickstart',
  'InboxRhino quickstart — create an inbox and assert the email',
  'Create an InboxRhino API key, provision a real test inbox, wait for signup or reset mail, then delete the inbox. Copy-paste curl and Playwright in about five minutes.',
);

export default function DocsIndexPage() {
  redirect('/docs/quickstart');
}
