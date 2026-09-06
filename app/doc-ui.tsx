import type { ReactNode } from 'react';

export function MethodBadge({ method }: { method: string }) {
  return (
    <span className="rounded-md bg-[#0F3D3E] px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wide text-white">
      {method}
    </span>
  );
}

export function Endpoint({
  method,
  path,
  operationId,
  children,
}: {
  method: string;
  path: string;
  operationId: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 border-t border-[#1C1917]/10 pt-8">
      <div className="flex flex-wrap items-baseline gap-3">
        <MethodBadge method={method} />
        <h3 className="font-mono text-base font-bold">{path}</h3>
      </div>
      <p className="text-xs text-stone-500">
        operationId: <code className="font-mono">{operationId}</code>
      </p>
      {children}
    </section>
  );
}

export function SpecTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#1C1917]/10 bg-white">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead className="border-b border-[#1C1917]/10 bg-[#F7F4EF] text-xs uppercase tracking-wide text-stone-500">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-3 py-2 font-bold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]} className="border-b border-[#1C1917]/10 last:border-0 align-top">
              {row.map((cell, index) => (
                <td
                  key={`${row[0]}-${index}`}
                  className={index === 0 ? 'px-3 py-2 font-mono text-xs text-stone-800' : 'px-3 py-2 text-sm text-stone-700'}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
