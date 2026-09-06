import { NotFoundBody } from '@/app/not-found-body';

export const metadata = {
  title: { absolute: 'Page not found — InboxRhino' },
  robots: { index: false, follow: true },
};

export default function MarketingNotFound() {
  return <NotFoundBody />;
}
