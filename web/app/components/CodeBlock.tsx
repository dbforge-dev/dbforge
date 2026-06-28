"use client";

export function CodeBlock({ code, lang }: { code: string; lang: string }) {
  return (
    <div className="relative rounded-xl bg-white/5 border border-white/10 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <span className="text-white/30 text-xs font-mono">{lang}</span>
        <button
          onClick={() => navigator.clipboard.writeText(code)}
          className="text-white/30 hover:text-white/60 text-xs transition-colors"
        >
          copy
        </button>
      </div>
      <pre className="p-5 text-sm text-white/80 overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}
