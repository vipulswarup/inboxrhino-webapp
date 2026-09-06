import { SiteFrame } from '@/app/site-frame';

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <SiteFrame>{children}</SiteFrame>;
}
