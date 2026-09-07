export function CompareTable({
  columns,
  rows,
}: {
  columns: readonly [string, string, string];
  rows: readonly (readonly string[])[];
}) {
  return (
    <div className="mt-10 overflow-x-auto rounded-[22px] border border-[#1C1917]/10 bg-white">
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
  );
}
