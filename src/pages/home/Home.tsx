import { ArrowUpRight } from 'lucide-react';
import { useBrowser } from '../../browser/BrowserContext';
import { HOME } from '../../content/home';
import { PROFILES } from '../../content/links';
import { pageEntry } from '../registry';
import LyricStage from './LyricStage';

/** New Tab: the lyric stage, then a speed dial into the story. */
export default function Home() {
  const { open } = useBrowser();

  return (
    <div className="mx-auto w-full max-w-6xl 2xl:max-w-[1440px] px-4 pt-6 pb-14 sm:px-8 sm:pt-8 xl:px-12">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
        <div>
          <p className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">{HOME.eyebrow}</p>
          <h1 className="mt-2 font-display text-[2.1rem] leading-[1.05] text-ink sm:text-5xl">{HOME.title}</h1>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-ink-muted">{HOME.lead}</p>
      </header>

      <LyricStage />

      <section aria-label={HOME.speedDial} className="mt-12">
        <h2 className="mb-3 font-mono text-[10.5px] tracking-[0.22em] text-ink-muted uppercase">{HOME.speedDial}</h2>
        <ul className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-3">
          {HOME.tiles.map((id) => {
            const page = pageEntry(id);
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => open(id)}
                  className="hud-ticks gx-tile glass group relative flex h-full w-full flex-col items-start gap-3 overflow-hidden rounded-2xl p-5 text-left"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.04] text-ink-muted transition-colors group-hover:text-accent">
                    <page.icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-ink">{page.title}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-ink-muted">{page.blurb}</span>
                  </span>
                  <span className="mt-auto font-mono text-[10.5px] text-ink-muted/70">{page.url}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <footer className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/[0.06] pt-5 font-mono text-[11px] text-ink-muted">
        <span>{HOME.elsewhere}</span>
        {Object.values(PROFILES).map((profile) => (
          <a
            key={profile.href}
            href={profile.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 transition-colors hover:text-accent"
          >
            {profile.label}
            <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
          </a>
        ))}
      </footer>
    </div>
  );
}
