import Image from 'next/image';

export function LogoIcon({ size = 36, priority = false }: { size?: number; priority?: boolean }) {
  return (
    <Image
      src="/brand/logo-icon.svg"
      width={size}
      height={size}
      alt="InboxRhino"
      priority={priority}
      unoptimized
    />
  );
}

export function LogoWordmark({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/logo-wordmark.svg"
      width={180}
      height={32}
      alt="InboxRhino"
      className={className}
      priority
      unoptimized
    />
  );
}
