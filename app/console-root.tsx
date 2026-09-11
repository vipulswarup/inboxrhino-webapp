import { ConsoleHome } from './console-home';
import { ConsoleProviders } from './console-providers';

export function ConsoleRoot() {
  return (
    <ConsoleProviders>
      <ConsoleHome />
    </ConsoleProviders>
  );
}
