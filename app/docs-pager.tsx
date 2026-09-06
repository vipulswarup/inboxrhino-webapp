import Link from 'next/link';

export function DocsPager() {
  return (
    <nav aria-label="Documentation" className="flex flex-wrap gap-x-5 gap-y-2 border-t border-[#1C1917]/10 pt-6 text-sm font-semibold">
      <Link href="/" className="text-[#0F3D3E] hover:underline">
        InboxRhino home
      </Link>
      <Link href="/docs" className="text-[#0F3D3E] hover:underline">
        Documentation
      </Link>
      <Link href="/docs/quickstart" className="text-[#0F3D3E] hover:underline">
        API quickstart
      </Link>
      <Link href="/docs/api" className="text-[#0F3D3E] hover:underline">
        API reference
      </Link>
      <Link href="/docs/playwright" className="text-[#0F3D3E] hover:underline">
        Playwright email tests
      </Link>
    </nav>
  );
}
