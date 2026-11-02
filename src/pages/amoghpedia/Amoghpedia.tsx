import { useEffect, useState, type ReactNode } from 'react';
import { ArrowUpRight, ChevronDown, Info } from 'lucide-react';
import { useBrowser } from '../../browser/BrowserContext';
import { ARTICLE, CITATIONS, INFOBOX, type Citation } from '../../content/amoghpedia';
import { useReducedMotion } from '../../lib/useReducedMotion';
import { pageEntry } from '../registry';
import RichText, { PageLink, numberCitations } from './RichText';

const NUMBERS = numberCitations([...ARTICLE.lead, ...ARTICLE.sections.flatMap((s) => s.body)]);
const REFERENCES = [...NUMBERS.entries()].sort((a, b) => a[1] - b[1]);
const PARAGRAPH = 'text-[15.5px] leading-[1.8] text-ink/85';

/** Paragraphs, with runs of "- " lines as lists and "> " lines as quotes. */
function Body({ lines }: { lines: ReadonlyArray<string> }) {
  const blocks: ReactNode[] = [];
  for (let i = 0; i < lines.length; i++) {
    const kind = lines[i].startsWith('- ') ? 'ul' : lines[i].startsWith('> ') ? 'quote' : 'p';
    if (kind === 'p') {
      blocks.push(
        <p key={i} className={PARAGRAPH}>
          <RichText text={lines[i]} numbers={NUMBERS} />
        </p>,
      );
      continue;
    }
    const run: string[] = [];
    while (i < lines.length && lines[i].startsWith(kind === 'ul' ? '- ' : '> ')) run.push(lines[i++].slice(2));
    i -= 1;
    blocks.push(
      kind === 'ul' ? (
        <ul key={i} className={`${PARAGRAPH} list-disc space-y-1.5 pl-5 marker:text-accent/70`}>
          {run.map((line) => (
            <li key={line}>
              <RichText text={line} numbers={NUMBERS} />
            </li>
          ))}
        </ul>
      ) : (
        <div key={i} className="space-y-1 border-l-2 border-accent/50 py-1 pl-5">
          {run.map((line) => (
            <blockquote key={line} className="font-display text-2xl leading-snug text-ink italic">
              “{line}”
            </blockquote>
          ))}
        </div>
      ),
    );
  }
  return <div className="space-y-4">{blocks}</div>;
}

/** Which section is in view, for the contents box. */
function useActiveSection(ids: ReadonlyArray<string>): string {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((e) => e.isIntersecting);
        if (hit) setActive(hit.target.id);
      },
      { root: document.getElementById('page-panel'), rootMargin: '-15% 0px -70% 0px' },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids]);
  return active;
}

const SECTION_IDS = ARTICLE.sections.map((s) => s.id);

/** Amoghpedia: an encyclopedia article about Amogh, playful but polished. */
export default function Amoghpedia() {
  const { open } = useBrowser();
  const reducedMotion = useReducedMotion();
  const active = useActiveSection(SECTION_IDS);
  const [flash, setFlash] = useState<string | null>(null);

  const jump = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    setFlash(id);
  };

  const contents = (
    <ol className="space-y-0.5 text-sm">
      {ARTICLE.sections.map((s, i) => (
        <li key={s.id}>
          <button
            type="button"
            onClick={() => jump(s.id)}
            aria-current={active === s.id ? 'location' : undefined}
            className={`flex w-full gap-2.5 rounded-md px-2 py-1 text-left transition-colors ${
              active === s.id ? 'bg-accent/[0.08] text-accent' : 'text-ink-muted hover:text-ink'
            }`}
          >
            <span className="font-mono text-[11px] leading-5 opacity-70">{i + 1}</span>
            <span className="leading-5">{s.title}</span>
          </button>
        </li>
      ))}
    </ol>
  );

  return (
    <article className="mx-auto w-full max-w-6xl px-4 pt-6 pb-16 sm:px-8 sm:pt-8">
      <header className="border-b border-white/[0.08] pb-4">
        <nav className="mb-5 flex gap-1 font-mono text-[11px]" aria-label={ARTICLE.tabs.label}>
          <span className="rounded-md border border-white/[0.1] bg-white/[0.05] px-2.5 py-1 text-ink">{ARTICLE.tabs.article}</span>
          <button type="button" onClick={() => open(ARTICLE.tabLinks.talk)} className="rounded-md px-2.5 py-1 text-ink-muted transition-colors hover:text-accent">
            {ARTICLE.tabs.talk}
          </button>
          <button type="button" onClick={() => open(ARTICLE.tabLinks.history)} className="rounded-md px-2.5 py-1 text-ink-muted transition-colors hover:text-accent">
            {ARTICLE.tabs.history}
          </button>
        </nav>
        <h1 className="font-display text-5xl leading-none text-ink sm:text-6xl">{ARTICLE.title}</h1>
        <p className="mt-3 text-sm text-ink-muted italic">{ARTICLE.subtitle}</p>
      </header>

      <div className="mt-6 lg:grid lg:grid-cols-[12.5rem_minmax(0,1fr)] lg:gap-10">
        <aside className="mb-6 lg:mb-0">
          <div className="hidden lg:sticky lg:top-6 lg:block">
            <p className="mb-2 px-2 font-mono text-[10.5px] tracking-[0.2em] text-ink-muted uppercase">{ARTICLE.contents}</p>
            {contents}
          </div>
          <details className="group rounded-xl border border-white/[0.08] bg-surface/50 lg:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-mono text-[11px] tracking-[0.18em] text-ink-muted uppercase">
              {ARTICLE.contents}
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" strokeWidth={1.8} />
            </summary>
            <div className="px-2 pb-3">{contents}</div>
          </details>
        </aside>

        <div className="min-w-0">
          <div className="mb-6 flex gap-3 rounded-xl border border-white/[0.08] border-l-accent/70 bg-surface/60 px-4 py-3 text-sm [border-left-width:3px]">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={1.8} />
            <p className="text-ink-muted">
              <strong className="font-semibold text-ink">{ARTICLE.banner.title}</strong> {ARTICLE.banner.body}
            </p>
          </div>

          <Infobox />

          <Body lines={ARTICLE.lead} />

          {ARTICLE.sections.map((section) => (
            <section key={section.id} className="mt-10 scroll-mt-6">
              <h2
                id={section.id}
                onAnimationEnd={() => setFlash(null)}
                className="mb-4 scroll-mt-6 border-b border-white/[0.08] pb-2 font-display text-3xl text-ink"
                style={flash === section.id ? { animation: 'section-flash 1.4s ease-out' } : undefined}
              >
                {section.title}
              </h2>
              <Body lines={section.body} />
            </section>
          ))}

          <section className="mt-10">
            <h2 className="mb-4 border-b border-white/[0.08] pb-2 font-display text-3xl text-ink">{ARTICLE.seeAlso}</h2>
            <ul className={`${PARAGRAPH} list-disc space-y-1 pl-5 marker:text-accent/70`}>
              {ARTICLE.seeAlsoPages.map((id) => (
                <li key={id}>
                  <PageLink to={id}>{pageEntry(id).title}</PageLink>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="mb-4 border-b border-white/[0.08] pb-2 font-display text-3xl text-ink">{ARTICLE.references}</h2>
            <ol className="space-y-2.5 text-sm text-ink-muted">
              {REFERENCES.map(([id, n]) => {
                const citation: Citation = CITATIONS[id];
                return (
                  <li key={id} className="flex gap-3">
                    <span className="w-6 shrink-0 font-mono text-xs leading-5 text-accent/80">{n}.</span>
                    <span className="leading-5">
                      {citation.href ? (
                        <a href={citation.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-ink hover:text-accent">
                          {citation.label}
                          <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
                        </a>
                      ) : (
                        <span className="text-ink">{citation.label}</span>
                      )}
                      {citation.note && <span className="ml-1.5">{citation.note}</span>}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>

          <p className="mt-12 border-t border-white/[0.08] pt-4 font-mono text-[11px] text-ink-muted">{ARTICLE.lastEdited}</p>
        </div>
      </div>
    </article>
  );
}

/** The summary box: photo (or a monogram until there is one), facts, links. */
function Infobox() {
  return (
    <aside className="glass relative mb-6 overflow-hidden rounded-2xl md:float-right md:mb-4 md:ml-8 md:w-72">
      <div className="grid aspect-[16/9] place-items-center md:aspect-[4/3] border-b border-white/[0.08] bg-[radial-gradient(ellipse_at_30%_20%,rgb(139_108_255/0.18),transparent_70%)]">
        {INFOBOX.photo ? (
          <img src={INFOBOX.photo} alt={INFOBOX.caption} className="h-full w-full object-cover" />
        ) : (
          <span className="font-display text-6xl text-ink/80" aria-hidden="true">
            {INFOBOX.monogram}
          </span>
        )}
      </div>
      <p className="border-b border-white/[0.06] px-4 py-2 text-center text-xs text-ink-muted">{INFOBOX.caption}</p>
      <dl className="divide-y divide-white/[0.06] text-[13px]">
        {INFOBOX.rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[6.5rem_1fr] gap-3 px-4 py-2.5">
            <dt className="font-mono text-[10.5px] leading-5 tracking-wide text-ink-muted uppercase">{row.label}</dt>
            <dd className="leading-5 text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex gap-4 border-t border-white/[0.06] px-4 py-3">
        {INFOBOX.links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono text-[11px] text-accent hover:underline"
          >
            {link.label}
            <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
          </a>
        ))}
      </div>
    </aside>
  );
}
