import { useBrowser } from '../../browser/BrowserContext';
import { HOME } from '../../content/home';
import { pageEntry } from '../registry';

/** New Tab: a welcome and a speed dial into the story. */
export default function Home() {
  const { open } = useBrowser();

  return (
    <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col justify-center px-5 py-12 sm:px-10">
      <header className="text-center">
        <p className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">{HOME.eyebrow}</p>
        <h1 className="mt-4 font-display text-[2.6rem] leading-[1.05] text-ink sm:text-6xl">{HOME.title}</h1>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-ink-muted">{HOME.lead}</p>
      </header>

      <section aria-label={HOME.speedDial} className="mt-12">
        <ul className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-3">
          {HOME.tiles.map((id) => {
            const page = pageEntry(id);
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => open(id)}
                  className="glass group flex h-full w-full flex-col items-start gap-3 rounded-2xl p-4 text-left transition-colors hover:border-accent/40 hover:bg-surface/70"
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
    </div>
  );
}
