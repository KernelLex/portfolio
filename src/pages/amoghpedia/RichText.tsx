import { ArrowUpRight } from 'lucide-react';
import { useBrowser } from '../../browser/BrowserContext';
import { parseAddress } from '../../browser/address';
import Hovercard from '../../components/Hovercard';
import { ARTICLE, CITATIONS, type Citation, type CitationId } from '../../content/amoghpedia';
import { pageEntry } from '../registry';

const TOKEN = /(\[\[[^\]]+\]\]|\{ref:[a-z0-9-]+\}|\{cn\}|\*\*[^*]+\*\*)/g;
const REF = /\{ref:([a-z0-9-]+)\}/g;

/** Citations are numbered by first appearance, across the whole article. */
export function numberCitations(paragraphs: ReadonlyArray<string>): Map<CitationId, number> {
  const order = new Map<CitationId, number>();
  for (const text of paragraphs) {
    for (const [, id] of text.matchAll(REF)) {
      if (id in CITATIONS && !order.has(id as CitationId)) order.set(id as CitationId, order.size + 1);
    }
  }
  return order;
}

/** A link to another tab, with a preview of it on hover. */
export function PageLink({ to, children }: { to: string; children: string }) {
  const { open } = useBrowser();
  const address = parseAddress(to);
  if (!address) return <>{children}</>;
  const page = pageEntry(address.page);
  return (
    <Hovercard
      onActivate={() => open(to)}
      className="text-accent underline decoration-accent/30 underline-offset-[3px] transition-colors hover:decoration-accent"
      card={
        <span className="flex gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-accent">
            <page.icon className="h-4 w-4" strokeWidth={1.7} />
          </span>
          <span className="min-w-0">
            <span className="block font-medium">{page.title}</span>
            <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">{page.blurb}</span>
            <span className="mt-1.5 block font-mono text-[10.5px] text-ink-muted/80">{page.url}</span>
          </span>
        </span>
      }
    >
      {children}
    </Hovercard>
  );
}

export function SourceCard({ citation }: { citation: Citation }) {
  return (
    <span className="block">
      <span className="block font-mono text-[10px] tracking-[0.16em] text-ink-muted uppercase">{ARTICLE.source}</span>
      <span className="mt-1 block leading-snug">{citation.label}</span>
      {citation.note && <span className="mt-1 block text-xs text-ink-muted">{citation.note}</span>}
      {citation.href && (
        <a
          href={citation.href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 font-mono text-[11px] text-accent hover:underline"
        >
          {citation.href.replace(/^https?:\/\//, '').replace(/\/$/, '')}
          <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
        </a>
      )}
    </span>
  );
}

const SUP = 'mx-px align-super font-mono text-[0.68em] leading-none text-accent/90 hover:text-accent';

/** Renders the article's light markup: tab links, citations, [citation needed], bold. */
export default function RichText({ text, numbers }: { text: string; numbers: Map<CitationId, number> }) {
  return (
    <>
      {text.split(TOKEN).map((part, i) => {
        if (part.startsWith('[[')) {
          const [to, label] = part.slice(2, -2).split('|');
          return (
            <PageLink key={i} to={to}>
              {label ?? to}
            </PageLink>
          );
        }
        if (part.startsWith('{ref:')) {
          const id = part.slice(5, -1) as CitationId;
          const n = numbers.get(id);
          if (!n) return null;
          return (
            <Hovercard key={i} label={`Citation ${n}`} className={SUP} card={<SourceCard citation={CITATIONS[id]} />}>
              [{n}]
            </Hovercard>
          );
        }
        if (part === '{cn}') {
          return (
            <Hovercard key={i} className={`${SUP} italic`} card={<span className="text-xs text-ink-muted">{ARTICLE.citationNeededNote}</span>}>
              [{ARTICLE.citationNeeded}]
            </Hovercard>
          );
        }
        if (part.startsWith('**')) {
          return (
            <strong key={i} className="font-semibold text-ink">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      })}
    </>
  );
}
