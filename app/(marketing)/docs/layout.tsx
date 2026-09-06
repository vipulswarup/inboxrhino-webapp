import type { ReactNode } from 'react';
import Link from 'next/link';
import { OPENAPI_PATH, POSTMAN_COLLECTION_PATH } from '@/app/lib/site';

const items = [
  { href: '/docs', label: 'Docs overview' },
  { href: '/docs/quickstart', label: 'API quickstart' },
  { href: '/docs/api', label: 'API reference' },
  { href: '/docs/playwright', label: 'Playwright email tests' },
];

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[200px_minmax(0,1fr)]">
      <aside>
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F3D3E]">Docs</p>
        <nav className="flex flex-col gap-1 text-sm font-semibold">
          <Link href="/" className="rounded-lg px-2 py-1.5 text-stone-700 hover:bg-white hover:text-[#0F3D3E]">
            InboxRhino home
          </Link>
          {items.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-lg px-2 py-1.5 text-stone-700 hover:bg-white hover:text-[#0F3D3E]">
              {item.label}
            </Link>
          ))}
        </nav>
        <p className="mt-6 mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#0F3D3E]">Downloads</p>
        <nav className="flex flex-col gap-1 text-sm font-semibold">
          <a href={POSTMAN_COLLECTION_PATH} download="InboxRhino.postman_collection.json" className="rounded-lg px-2 py-1.5 text-stone-700 hover:bg-white hover:text-[#0F3D3E]">
            Postman collection
          </a>
          <a href={OPENAPI_PATH} download="inboxrhino.openapi.yaml" className="rounded-lg px-2 py-1.5 text-stone-700 hover:bg-white hover:text-[#0F3D3E]">
            OpenAPI spec
          </a>
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
