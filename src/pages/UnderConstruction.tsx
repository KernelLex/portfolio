import { useBrowser } from '../browser/BrowserContext';
import { UNDER_CONSTRUCTION } from '../content/browser';
import { playClick } from '../lib/sound';
import type { PageEntry } from './registry';

/** Stands in for a page that is not built yet - and keeps a question asked of it. */
export default function UnderConstruction({ entry }: { entry: PageEntry }) {
  const { address, open } = useBrowser();
  const asked = entry.id === 'ask' ? address.query.get('q') : null;

  return (
    <div className="grid min-h-full place-items-center px-5 py-12">
      <section className="glass w-full max-w-md rounded-2xl px-6 py-9 text-center sm:px-9">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-accent">
          <entry.icon className="h-5 w-5" strokeWidth={1.6} />
        </span>
        <p className="mt-6 font-mono text-[11px] tracking-[0.16em] text-ink-muted uppercase">{UNDER_CONSTRUCTION.badge}</p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">{entry.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">{entry.blurb}</p>

        {asked && (
          <figure className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-left">
            <figcaption className="font-mono text-[10px] tracking-[0.16em] text-ink-muted uppercase">{UNDER_CONSTRUCTION.asked}</figcaption>
            <blockquote className="mt-1.5 text-sm text-ink">“{asked}”</blockquote>
            <p className="mt-2 text-xs text-ink-muted">{UNDER_CONSTRUCTION.askNote}</p>
          </figure>
        )}

        <p className="mt-6 text-xs leading-relaxed text-ink-muted">{UNDER_CONSTRUCTION.note}</p>
        <button
          type="button"
          onClick={() => {
            playClick();
            open('home');
          }}
          className="mt-6 rounded-lg border border-white/[0.1] px-4 py-2 text-sm text-ink transition-colors hover:border-accent/50 hover:text-accent"
        >
          {UNDER_CONSTRUCTION.back}
        </button>
      </section>
    </div>
  );
}
