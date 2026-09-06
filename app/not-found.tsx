import { SiteFrame } from './site-frame';
import { NotFoundBody } from './not-found-body';

export const metadata = {
  title: { absolute: 'Page not found — InboxRhino' },
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <SiteFrame>
      <NotFoundBody />
    </SiteFrame>
  );
}
