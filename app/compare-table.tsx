import { JsonLd } from './json-ld';
import { faqPageJsonLd, type Faq } from './lib/seo';

export function CompareTable({
  heading,
  columns,
  rows,
}: {
  heading: string;
  columns: readonly [string, string, string];
  rows: readonly (readonly string[])[];
}) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-[#1C1917]">{heading}</h2>
      <div className="mt-4 overflow-x-auto rounded-[22px] border border-[#1C1917]/10 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-[#1C1917]/10 bg-[#F7F4EF] text-xs uppercase tracking-wide text-stone-500">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-4 py-3 font-bold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[0]} className="border-b border-[#1C1917]/10 last:border-0">
                {row.map((cell, index) => (
                  <td key={`${row[0]}-${index}`} className="px-4 py-3 text-stone-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function CompareFaq({ faqs }: { faqs: readonly Faq[] }) {
  return (
    <section className="mt-12">
      <JsonLd data={faqPageJsonLd(faqs)} />
      <h2 className="text-xl font-bold text-[#1C1917]">Frequently asked questions</h2>
      <dl className="mt-4 divide-y divide-[#1C1917]/10 border-y border-[#1C1917]/10">
        {faqs.map((item) => (
          <div key={item.q} className="grid gap-2 py-5 md:grid-cols-[280px_minmax(0,1fr)]">
            <dt className="font-bold">{item.q}</dt>
            <dd className="text-sm leading-6 text-stone-600">{item.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
