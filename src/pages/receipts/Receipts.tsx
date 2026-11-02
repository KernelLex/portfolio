import { useState } from 'react';
import { ArrowDown, ArrowUpRight, Cpu, Mic } from 'lucide-react';
import { RECEIPTS, RECEIPTS_PAGE as P, type ReceiptTool } from '../../content/receipts';
import { countWords } from '../../voice/useWisprInput';

const TOOLS = [...new Set(RECEIPTS.map((r) => r.tool))];
const TOTAL_WORDS = RECEIPTS.reduce((n, r) => n + countWords(r.spoken), 0);
const when = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });

/** Voice Receipts: the build log, newest first, each spoken prompt beside what it built. */
export default function Receipts() {
  const [tool, setTool] = useState<ReceiptTool | null>(null);
  const shown = RECEIPTS.filter((r) => !tool || r.tool === tool).slice().reverse();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pt-6 pb-16 sm:px-8 sm:pt-8">
      <header>
        <p className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">{P.eyebrow}</p>
        <h1 className="mt-2 font-display text-5xl text-ink sm:text-6xl">{P.title}</h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-muted">{P.lead}</p>
      </header>

      <dl className="mt-8 grid grid-cols-3 gap-3">
        {[
          [P.stats.entries, String(RECEIPTS.length)],
          [P.stats.words, TOTAL_WORDS.toLocaleString('en-IN')],
          [P.stats.spoken, P.stats.spokenValue],
        ].map(([label, value]) => (
          <div key={label} className="hud-ticks relative rounded-2xl border border-white/[0.08] bg-surface/60 px-4 py-4">
            <dt className="font-mono text-[10px] tracking-[0.16em] text-ink-muted uppercase">{label}</dt>
            <dd className="mt-1.5 font-mono text-2xl text-ink sm:text-3xl">{value}</dd>
          </div>
        ))}
      </dl>

      {TOOLS.length > 1 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {[null, ...TOOLS].map((t) => (
            <button
              key={t ?? 'all'}
              type="button"
              aria-pressed={tool === t}
              onClick={() => setTool(t)}
              className={`rounded-lg border px-3 py-1.5 font-mono text-xs ${tool === t ? 'border-accent/60 bg-accent/10 text-accent' : 'border-white/[0.1] text-ink-muted hover:text-ink'}`}
            >
              {t ?? P.all}
            </button>
          ))}
        </div>
      )}

      <ol className="relative mt-8 space-y-6 border-l border-white/[0.08] pl-6 font-mono">
        {shown.map((r) => (
          <li key={r.id} className="relative">
            <span className="absolute top-1.5 -left-[29px] h-2.5 w-2.5 rounded-full border border-accent bg-space" aria-hidden="true" />
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-muted">
              <time dateTime={r.at}>{when(r.at)}</time>
              <span className="rounded border border-white/[0.1] px-1.5 py-0.5">{r.tool}</span>
            </div>
            <article className="mt-2 overflow-hidden rounded-2xl border border-white/[0.08] bg-surface/70">
              <div className="border-b border-dashed border-white/[0.1] p-4">
                <p className="mb-2 flex items-center gap-1.5 text-[10px] tracking-[0.18em] text-accent uppercase">
                  <Mic className="h-3 w-3" strokeWidth={2} />
                  {P.said}
                  {r.excerpt && <span className="tracking-normal text-ink-muted normal-case">({P.excerpt})</span>}
                </p>
                <p className="font-ui text-[14.5px] leading-relaxed whitespace-pre-line text-ink/90">“{r.spoken}”</p>
              </div>
              <div className="flex justify-center py-1 text-ink-muted/60" aria-hidden="true">
                <ArrowDown className="h-3.5 w-3.5" />
              </div>
              <div className="px-4 pb-4">
                <p className="mb-2 flex items-center gap-1.5 text-[10px] tracking-[0.18em] text-ink-muted uppercase">
                  <Cpu className="h-3 w-3" strokeWidth={2} />
                  {P.built}
                </p>
                <p className="font-ui text-[14.5px] leading-relaxed text-ink">{r.result}</p>
                {r.commits && (
                  <p className="mt-3 flex flex-wrap gap-2 text-[11px]">
                    {r.commits.map((c) => (
                      <a key={c} href={`${P.repo}/commit/${c}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded border border-white/[0.1] px-1.5 py-0.5 text-ink-muted hover:border-accent/50 hover:text-accent">
                        {P.commit} {c}
                        <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
                      </a>
                    ))}
                  </p>
                )}
              </div>
            </article>
          </li>
        ))}
      </ol>

      <a href={P.repo} target="_blank" rel="noopener noreferrer" className="mt-10 inline-flex items-center gap-1.5 font-mono text-xs text-ink-muted hover:text-accent">
        {P.repoLabel}
        <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
      </a>
    </div>
  );
}
