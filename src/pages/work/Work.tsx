import { ArrowLeft, ArrowRight, Lock, MessageCircle, PlayCircle, Radio } from 'lucide-react';
import { askAddress } from '../../browser/address';
import { useBrowser } from '../../browser/BrowserContext';
import LiveLinks from '../../components/LiveLinks';
import ClipPlayer from '../../components/ClipPlayer';
import { SIDE_BUILDS } from '../../content/sideBuilds';
import { ALL_WORK, CLIENT_WORK, NOVA_PRODUCTS, WORK, type CaseStudy } from '../../content/work';
import { playClick } from '../../lib/sound';

/** Client Work: the grid at amogh://work, a case study at amogh://work/<slug>. */
export default function Work() {
  const { address } = useBrowser();
  const slug = address.rest[0];
  return slug ? <Study slug={slug} /> : <Grid />;
}

function Badge({ study }: { study: CaseStudy }) {
  const [Icon, text] = study.live ? [Radio, WORK.live] : study.video ? [PlayCircle, WORK.sections.watch] : [Lock, WORK.private];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-space/70 px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-ink-muted uppercase backdrop-blur">
      <Icon className={`h-3 w-3 ${study.live ? 'text-accent' : ''}`} strokeWidth={2} />
      {text}
    </span>
  );
}

function Card({ study }: { study: CaseStudy }) {
  const { navigate } = useBrowser();
  return (
    <button
      type="button"
      onClick={() => {
        playClick();
        navigate(`work/${study.slug}`);
      }}
      className="hud-ticks glass group relative flex h-full w-full flex-col overflow-hidden rounded-2xl text-left transition-colors hover:border-accent/40"
    >
      <span className="relative block h-36 overflow-hidden border-b border-white/[0.06]" style={{ background: study.tint }}>
        <span className="lyric-scan absolute inset-0 opacity-60" />
        <span className="absolute bottom-3 left-4 font-display text-[2.6rem] leading-none whitespace-nowrap text-ink/90 transition-transform duration-500 group-hover:-translate-y-1">
          {study.name}
        </span>
        <span className="absolute top-3 right-3">
          <Badge study={study} />
        </span>
      </span>
      <span className="flex flex-1 flex-col gap-3 p-4">
        <span className="font-mono text-[10.5px] tracking-[0.16em] text-accent/90 uppercase">{study.kind}</span>
        <span className="text-sm leading-relaxed text-ink">{study.hook}</span>
        <span className="mt-auto flex flex-wrap gap-1.5">
          {study.tags.map((tag) => (
            <span key={tag} className="rounded-md bg-white/[0.05] px-2 py-0.5 text-[11px] text-ink-muted">
              {tag}
            </span>
          ))}
        </span>
      </span>
    </button>
  );
}

function Grid() {
  const { open } = useBrowser();
  return (
    <div className="mx-auto w-full max-w-6xl 2xl:max-w-[1440px] px-4 pt-6 pb-16 sm:px-8 sm:pt-8 xl:px-12">
      <header className="max-w-2xl">
        <p className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">amogh://work</p>
        <h1 className="mt-2 font-display text-5xl text-ink sm:text-6xl">{WORK.title}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">{WORK.lead}</p>
      </header>

      <h2 className="mt-10 mb-4 font-mono text-[10.5px] tracking-[0.22em] text-ink-muted uppercase">{WORK.clientsHeading}</h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CLIENT_WORK.map((study) => (
          <li key={study.slug}>
            <Card study={study} />
          </li>
        ))}
      </ul>

      <h2 className="mt-12 mb-1 font-mono text-[10.5px] tracking-[0.22em] text-ink-muted uppercase">{WORK.novaHeading}</h2>
      <p className="mb-4 max-w-2xl text-sm leading-relaxed text-ink-muted">{WORK.novaLead}</p>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {NOVA_PRODUCTS.map((study) => (
          <li key={study.slug}>
            <Card study={study} />
          </li>
        ))}
      </ul>

      {/* The other projects, here too: side builds and collaborations, each leading to their page. */}
      <div className="mt-12 mb-1 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-mono text-[10.5px] tracking-[0.22em] text-ink-muted uppercase">{WORK.otherHeading}</h2>
        <button type="button" onClick={() => open('side-builds')} className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
          {WORK.otherAll}
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>
      <p className="mb-4 max-w-2xl text-sm leading-relaxed text-ink-muted">{WORK.otherLead}</p>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SIDE_BUILDS.map((b) => (
          <li key={b.name}>
            <button
              type="button"
              onClick={() => {
                playClick();
                open('side-builds');
              }}
              className="glass group flex h-full w-full flex-col gap-1.5 rounded-xl p-4 text-left transition-colors hover:border-accent/40"
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="font-display text-xl leading-tight text-ink">{b.name}</span>
                {b.stat ? (
                  <span className="shrink-0 font-mono text-xs text-accent">{b.stat.value}</span>
                ) : b.video ? (
                  <PlayCircle className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.8} aria-label={WORK.sections.watch} />
                ) : null}
              </span>
              <span className="text-[13px] leading-snug text-ink-muted">{b.hook.split('. ')[0].replace(/\.$/, '')}.</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Study({ slug }: { slug: string }) {
  const { navigate, open } = useBrowser();
  const index = ALL_WORK.findIndex((s) => s.slug === slug);
  const study = ALL_WORK[index];

  if (!study) {
    return (
      <div className="grid min-h-full place-items-center p-8 text-center">
        <div>
          <p className="text-ink-muted">{WORK.missing}</p>
          <button type="button" onClick={() => navigate('work')} className="mt-4 text-sm text-accent hover:underline">
            {WORK.back}
          </button>
        </div>
      </div>
    );
  }

  const prev = ALL_WORK[(index - 1 + ALL_WORK.length) % ALL_WORK.length];
  const next = ALL_WORK[(index + 1) % ALL_WORK.length];
  const block = 'rounded-2xl border border-white/[0.08] bg-surface/50 p-5';
  const label = 'mb-2 font-mono text-[10.5px] tracking-[0.2em] text-accent/90 uppercase';

  return (
    <article className="mx-auto w-full max-w-5xl px-4 pt-6 pb-16 sm:px-8 sm:pt-8 xl:max-w-6xl xl:px-12 2xl:max-w-7xl">
      <button
        type="button"
        onClick={() => navigate('work')}
        className="mb-5 inline-flex items-center gap-1.5 font-mono text-[11px] text-ink-muted transition-colors hover:text-accent"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        {WORK.back}
      </button>

      <header className="relative overflow-hidden rounded-3xl border border-white/[0.08] p-6 sm:p-9" style={{ background: study.tint }}>
        <span className="lyric-scan absolute inset-0" aria-hidden="true" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[11px] tracking-[0.2em] text-ink/80 uppercase">{study.kind}</span>
            <Badge study={study} />
          </div>
          <h1 className="mt-3 font-display text-5xl leading-none text-ink sm:text-7xl">{study.name}</h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink/90">{study.hook}</p>
          <div className="mt-6">
            {study.live ? <LiveLinks site={study.live} /> : study.privacy && <p className="font-mono text-xs text-ink-muted">{study.privacy}</p>}
          </div>
        </div>
      </header>

      {study.video && <ClipPlayer clip={study.video} className="mt-8 max-w-4xl" />}

      <div className="mt-8">
        <div>
          <div className="grid gap-4 md:grid-cols-2">
            <section className={block}>
              <h2 className={label}>{WORK.sections.problem}</h2>
              <p className="text-[15px] leading-relaxed text-ink/90">{study.problem}</p>
            </section>
            <section className={block}>
              <h2 className={label}>{WORK.sections.result}</h2>
              <p className="text-[15px] leading-relaxed text-ink/90">{study.result}</p>
            </section>
            <section className={`${block} md:col-span-2`}>
              <h2 className={label}>{WORK.sections.built}</h2>
              <ul className="space-y-2.5 text-[15px] leading-relaxed text-ink/90">
                {study.built.map((line) => (
                  <li key={line} className="flex gap-3">
                    <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                    {line}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="mt-6">
            <h2 className={label}>{WORK.sections.stack}</h2>
            <ul className="flex flex-wrap gap-2">
              {study.stack.map((tech) => (
                <li key={tech} className="rounded-lg border border-white/[0.08] px-2.5 py-1 font-mono text-[11px] text-ink-muted">
                  {tech}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <nav className="mt-10 flex flex-wrap items-center gap-3 border-t border-white/[0.08] pt-6">
        <button type="button" onClick={() => navigate(`work/${prev.slug}`)} className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
          {prev.name}
        </button>
        <button
          type="button"
          onClick={() => open(askAddress(WORK.ask(study.name)))}
          className="mx-auto inline-flex items-center gap-2 rounded-lg border border-accent/40 px-3.5 py-2 text-sm text-accent transition-colors hover:bg-accent/10"
        >
          <MessageCircle className="h-4 w-4" strokeWidth={1.8} />
          {WORK.askButton}
        </button>
        <button type="button" onClick={() => navigate(`work/${next.slug}`)} className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink">
          {next.name}
          <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
        </button>
      </nav>
    </article>
  );
}
