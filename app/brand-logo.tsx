export function LogoIcon({ size = 36, priority = false }: { size?: number; priority?: boolean }) {
  return (
    <img
      src="/brand/logo-icon.svg"
      width={size}
      height={size}
      alt="InboxRhino"
      decoding="async"
      {...(priority ? { fetchPriority: 'high' as const } : {})}
    />
  );
}

export function LogoWordmark({ className }: { className?: string }) {
  return (
    <img
      src="/brand/logo-wordmark.svg"
      width={180}
      height={32}
      alt="InboxRhino"
      className={className}
      decoding="async"
      fetchPriority="high"
    />
  );
}
