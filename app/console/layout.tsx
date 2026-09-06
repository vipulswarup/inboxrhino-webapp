import { ConsoleProviders } from '../console-providers';

export const metadata = {
  robots: { index: false, follow: false },
};

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return <ConsoleProviders>{children}</ConsoleProviders>;
}
