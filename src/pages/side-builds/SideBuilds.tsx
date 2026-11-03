import { ArrowUpRight, MessageCircle, Play } from 'lucide-react';
import { askAddress } from '../../browser/address';
import { useBrowser } from '../../browser/BrowserContext';
import LiveLinks from '../../components/LiveLinks';
import { SIDE_BUILDS, SIDE_BUILDS_PAGE as P } from '../../content/sideBuilds';

/** Other Projects: a grid of side builds and collaborations, with live links where they exist. */
export default function SideBuilds() {
  const { open } = useBrowser();
  return (
    <div className="mx-auto w-full max-w-6xl 2xl:max-w-[1440px] px-4 pt-6 pb-16 sm:px-8 sm:pt-8 xl:px-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <p className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">{P.eyebrow}</p>
          <h1 className="mt-2 font-display text-5xl text-ink sm:text-6xl">{P.title}</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">{P.lead}</p>
        </div>
        <a href={P.github.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-muted hover:text-accent">
          {P.githubLabel}
          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
        </a>
      </header>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SIDE_BUILDS.map((b) => (
          <li key={b.name} className="hud-ticks glass relative flex flex-col gap-3 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-3xl leading-tight text-ink">{b.name}</h2>
              {b.stat && (
                <p className="shrink-0 text-right">
                  <span className="block font-mono text-lg text-accent">{b.stat.value}</span>
                  <span className="font-mono text-[10px] tracking-wide text-ink-muted uppercase">{b.stat.label}</span>
                </p>
              )}
            </div>
            <p className="text-sm leading-relaxed text-ink">{b.hook}</p>
            <p className="text-[13px] leading-relaxed text-ink-muted">{b.detail}</p>
            <ul className="flex flex-wrap gap-1.5">
              {b.stack.map((s) => (
                <li key={s} className="rounded-md bg-white/[0.05] px-2 py-0.5 font-mono text-[10.5px] text-ink-muted">
                  {s}
                </li>
              ))}
            </ul>
            {b.video && (
              <button
                type="button"
                onClick={() => open(`videos?v=${b.video!.id}`)}
                className="group relative mt-1 overflow-hidden rounded-xl border border-white/[0.08]"
              >
                <img src={b.video.clip.poster} alt="" loading="lazy" className="aspect-video w-full object-cover opacity-80 transition-opacity group-hover:opacity-100" />
                <span className="absolute inset-0 flex items-center justify-center gap-2 bg-black/30 text-sm text-white">
                  <Play className="h-4 w-4 text-accent" fill="currentColor" strokeWidth={0} />
                  {P.watch}
                </span>
              </button>
            )}
            <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
              {b.live && <LiveLinks site={b.live} />}
              <button type="button" onClick={() => open(askAddress(P.ask(b.name)))} className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline">
                <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.8} />
                {P.askButton}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
