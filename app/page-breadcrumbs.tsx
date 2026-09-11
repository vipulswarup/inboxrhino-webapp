import { JsonLd } from './json-ld';
import { breadcrumbListJsonLd, type Crumb } from './lib/seo';

export function PageBreadcrumbs({ items }: { items: Crumb[] }) {
  const trail: Crumb[] = [{ name: 'InboxRhino home', path: '/' }, ...items];
  return (
    <>
      <JsonLd data={breadcrumbListJsonLd(trail)} />
      <nav aria-label="Breadcrumb" className="mb-8 text-sm text-stone-600">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {trail.map((item, index) => {
            const last = index === trail.length - 1;
            return (
              <li key={`${item.path}-${item.name}`} className="flex items-center gap-2">
                {last ? (
                  <span aria-current="page" className="font-semibold text-[#1C1917]">
                    {item.name}
                  </span>
                ) : (
                  <a href={item.path} className="font-semibold text-[#0F3D3E] hover:underline">
                    {item.name}
                  </a>
                )}
                {last ? null : (
                  <span aria-hidden="true" className="text-stone-400">
                    /
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
