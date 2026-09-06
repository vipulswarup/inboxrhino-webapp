export function CodeSnippet({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto rounded-[18px] border border-[#1C1917]/10 bg-[#1C1917] p-5 text-[13px] leading-6 text-[#F7F4EF]">
      <code className="font-mono">{code}</code>
    </pre>
  );
}
