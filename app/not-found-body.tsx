import Link from 'next/link';

export function NotFoundBody() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-bold tracking-[-0.04em]">Page not found</h1>
      <p className="mt-4 text-sm leading-6 text-stone-600">
        That URL is not a public InboxRhino page. Use one of these instead.
      </p>
      <nav className="mt-8 flex flex-col gap-3 text-sm font-bold">
        <Link href="/" className="text-[#0F3D3E] hover:underline">
          InboxRhino home
        </Link>
        <Link href="/docs" className="text-[#0F3D3E] hover:underline">
          Documentation
        </Link>
        <Link href="/docs/quickstart" className="text-[#0F3D3E] hover:underline">
          API quickstart
        </Link>
        <Link href="/pricing" className="text-[#0F3D3E] hover:underline">
          InboxRhino pricing
        </Link>
      </nav>
    </main>
  );
}
