import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Award,
  Backpack,
  BrainCircuit,
  ChevronRight,
  Database,
  Flag,
  Gem,
  MapPin,
  MonitorSmartphone,
  Printer,
  Server,
  Swords,
  TrendingUp,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useBrowser } from '../../browser/BrowserContext';
import HudCorners from '../../components/HudCorners';
import { ACHIEVEMENTS, INVENTORY, LOADOUT, PROFILE as P, QUESTS, STATS } from '../../content/profile';
import { playClick } from '../../lib/sound';
import { useReducedMotion } from '../../lib/useReducedMotion';

const SLOT_ICONS: ReadonlyArray<LucideIcon> = [MonitorSmartphone, Database, BrainCircuit, Server];
const ITEM_ICONS: ReadonlyArray<LucideIcon> = [TrendingUp, Printer, Server, Gem];
const SPRITE = `${import.meta.env.BASE_URL}assets/intro/player-idle.png`;

const PANEL = 'relative rounded-2xl border border-white/[0.08] bg-surface/60 backdrop-blur-sm';
const HEADING = 'mb-4 flex items-center gap-2 font-mono text-[11px] tracking-[0.22em] text-accent uppercase';

/** A number that counts up the first time it is seen. */
function Counter({ value, reduced }: { value: number; reduced: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(reduced ? value : 0);
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / 1100);
      setShown(Math.round(value * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, reduced]);
  return <span ref={ref}>{shown}</span>;
}

/** Amogh as a character sheet: who he is, what he can do, what he has done. */
export default function Profile() {
  const { open } = useBrowser();
  const reduced = useReducedMotion();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 px-4 pt-2 pb-16 sm:px-8">
      {/* --- the character card --------------------------------------------- */}
      <section className="grid gap-5 lg:grid-cols-[22rem_1fr]">
        <div className={`${PANEL} overflow-hidden p-6`}>
          <HudCorners inset={10} size={12} />
          <div className="relative mx-auto grid h-56 w-56 place-items-center">
            <span aria-hidden="true" className="profile-ring absolute inset-0 rounded-full" />
            <span aria-hidden="true" className="absolute inset-6 rounded-full bg-[radial-gradient(circle,rgb(245_163_92/0.18),transparent_70%)]" />
            <div role="img" aria-label={P.name} className="profile-sprite relative" style={{ backgroundImage: `url(${SPRITE})` }} />
          </div>
          <p className="mt-4 text-center font-mono text-[11px] tracking-[0.3em] text-ink-muted">@{P.handle}</p>
          <h1 className="mt-1 text-center font-condensed text-5xl tracking-wide text-ink uppercase">{P.name}</h1>
          <p className="mt-1 text-center text-sm text-accent">{P.className}</p>
          <p className="mx-auto mt-3 max-w-xs text-center text-sm leading-relaxed text-ink-muted">{P.tagline}</p>
          <ul className="mt-5 space-y-2 text-[13px] text-ink/90">
            <li className="flex items-center gap-2.5">
              <MapPin className="h-4 w-4 text-ink-muted" strokeWidth={1.7} />
              {P.base}
            </li>
            <li className="flex items-center gap-2.5">
              <Users className="h-4 w-4 text-ink-muted" strokeWidth={1.7} />
              {P.party}
            </li>
            <li className="flex items-center gap-2.5">
              <span className="relative ml-1 h-2 w-2 rounded-full bg-[#b6f34b]" aria-hidden="true" />
              <span className="pl-0.5">{P.status}</span>
            </li>
          </ul>
          <div className="mt-5 flex gap-2">
            {P.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/[0.12] py-2 font-mono text-xs text-ink transition-colors hover:border-accent/50 hover:text-accent"
              >
                {link.label}
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
              </a>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className={`${PANEL} p-6`}>
            <h2 className={HEADING}>
              <Swords className="h-4 w-4" strokeWidth={1.8} />
              {P.headings.stats}
            </h2>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
              {STATS.map((s) => (
                <div key={s.label} className="hud-ticks relative rounded-xl border border-white/[0.08] bg-space/50 px-4 py-4">
                  <dd className="font-condensed text-5xl leading-none text-ink">
                    <Counter value={s.value} reduced={reduced} />
                  </dd>
                  <dt className="mt-2 font-mono text-[10px] leading-snug tracking-[0.12em] text-ink-muted uppercase">{s.label}</dt>
                </div>
              ))}
            </dl>
            <p className="mt-5 mb-2 font-mono text-[10px] tracking-[0.2em] text-ink-muted uppercase">{P.headings.languages}</p>
            <ul className="flex flex-wrap gap-2">
              {P.languages.map((l) => (
                <li key={l} className="rounded-full border border-accent/30 bg-accent/[0.06] px-3 py-1 text-xs text-ink">
                  {l}
                </li>
              ))}
            </ul>
          </div>

          <div className={`${PANEL} p-6`}>
            <h2 className={HEADING}>
              <Award className="h-4 w-4" strokeWidth={1.8} />
              {P.headings.loadout}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {LOADOUT.map((slot, i) => {
                const Icon = SLOT_ICONS[i];
                return (
                  <div key={slot.slot} className="rounded-xl border border-white/[0.08] bg-space/50 p-4">
                    <p className="mb-3 flex items-center gap-2 text-sm font-medium text-ink">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/10 text-accent">
                        <Icon className="h-4 w-4" strokeWidth={1.7} />
                      </span>
                      {slot.slot}
                    </p>
                    <ul className="flex flex-wrap gap-1.5">
                      {slot.items.map((item) => (
                        <li key={item} className="rounded-md bg-white/[0.05] px-2 py-1 font-mono text-[10.5px] text-ink/85">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* --- achievements ---------------------------------------------------- */}
      <section className={`${PANEL} p-6`}>
        <h2 className={HEADING}>
          <Trophy className="h-4 w-4" strokeWidth={1.8} />
          {P.headings.achievements}
        </h2>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {ACHIEVEMENTS.map((a, i) => (
            <li
              key={a.title}
              className={`achievement relative flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-transform hover:-translate-y-1 ${
                a.rare ? 'border-accent/40 bg-accent/[0.07]' : 'border-white/[0.08] bg-space/50'
              }`}
              style={reduced ? undefined : { animation: `guide-in 420ms ease-out ${i * 70}ms both` }}
            >
              <span className={`grid h-12 w-12 place-items-center rounded-full border-2 ${a.rare ? 'border-accent text-accent shadow-[0_0_18px_rgb(245_163_92/0.35)]' : 'border-white/20 text-ink'}`}>
                <Trophy className="h-5 w-5" strokeWidth={1.7} />
              </span>
              <p className="text-sm font-medium text-ink">{a.title}</p>
              <p className="text-[11.5px] leading-snug text-ink-muted">{a.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* --- the quest log --------------------------------------------------- */}
      <section className={`${PANEL} p-6`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className={HEADING}>
            <Flag className="h-4 w-4" strokeWidth={1.8} />
            {P.headings.quests}
          </h2>
          <p className="mb-4 font-mono text-[10.5px] text-ink-muted">{P.questHint}</p>
        </div>
        <ol className="relative flex snap-x gap-3 overflow-x-auto pb-3 [scrollbar-width:thin]">
          <span aria-hidden="true" className="pointer-events-none absolute top-[1.15rem] right-4 left-4 h-px bg-gradient-to-r from-accent/60 via-accent/30 to-accent/60" />
          {QUESTS.map((q, i) => (
            <li key={q.title} className="relative w-52 shrink-0 snap-start">
              <span className="relative z-10 mx-auto mb-3 grid h-9 w-9 place-items-center rounded-full border-2 border-accent bg-space font-mono text-xs text-accent">
                {String(i + 1).padStart(2, '0')}
              </span>
              <button
                type="button"
                disabled={!q.to}
                onClick={() => {
                  if (!q.to) return;
                  playClick();
                  open(q.to);
                }}
                className="hud-ticks group relative block h-full w-full rounded-xl border border-white/[0.08] bg-space/50 p-4 text-left transition-colors hover:border-accent/40"
              >
                {q.when && <span className="font-mono text-[10px] text-accent">{q.when}</span>}
                <span className="block text-sm font-medium text-ink">{q.title}</span>
                <span className="mt-1 block text-xs leading-snug text-ink-muted">{q.detail}</span>
                {q.to && <ChevronRight className="absolute right-3 bottom-3 h-4 w-4 text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />}
              </button>
            </li>
          ))}
        </ol>
      </section>

      {/* --- inventory ------------------------------------------------------- */}
      <section className={`${PANEL} p-6`}>
        <h2 className={HEADING}>
          <Backpack className="h-4 w-4" strokeWidth={1.8} />
          {P.headings.inventory}
        </h2>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {INVENTORY.map((it, i) => {
            const Icon = ITEM_ICONS[i];
            return (
              <li key={it.item} className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-space/50 p-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-white/[0.1] bg-[radial-gradient(circle,rgb(84_232_224/0.12),transparent_70%)] text-ink">
                  <Icon className="h-5 w-5" strokeWidth={1.6} />
                </span>
                <span>
                  <span className="block text-sm text-ink">{it.item}</span>
                  <span className="block text-[11.5px] leading-snug text-ink-muted">{it.use}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
