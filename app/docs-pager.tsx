export function DocsPager() {
  return (
    <nav aria-label="Documentation" className="flex flex-wrap gap-x-5 gap-y-2 border-t border-[#1C1917]/10 pt-6 text-sm font-semibold">
      <a href="/" className="text-[#0F3D3E] hover:underline">
        InboxRhino home
      </a>
      <a href="/docs" className="text-[#0F3D3E] hover:underline">
        Documentation
      </a>
      <a href="/docs/quickstart" className="text-[#0F3D3E] hover:underline">
        API quickstart
      </a>
      <a href="/docs/api" className="text-[#0F3D3E] hover:underline">
        API reference
      </a>
      <a href="/docs/playwright" className="text-[#0F3D3E] hover:underline">
        Playwright email testing
      </a>
    </nav>
  );
}
