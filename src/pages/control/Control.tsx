import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowUpRight, ChevronRight, Mic, X } from 'lucide-react';
import { useBrowser } from '../../browser/BrowserContext';
import { CONTROL as COPY, GAUGES, type Gauge } from '../../content/control';
import { playClick } from '../../lib/sound';
import { useReducedMotion } from '../../lib/useReducedMotion';
import { useWisprInput } from '../../voice/useWisprInput';
import WisprHint from '../../voice/WisprHint';

const WPM_MAX = 300;
const TYPING_WPM = 40;
const R = 44;
const C = 2 * Math.PI * R;

/** A ring that fills and counts up to its value. */
function Ring({ value, max, reduced }: { value: number; max: number; reduced: boolean }) {
  const arcRef = useRef<SVGCircleElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const part = Math.min(1, value / max);

  useEffect(() => {
    const arc = arcRef.current;
    const num = numRef.current;
    if (!arc || !num) return;
    if (reduced) {
      arc.style.strokeDashoffset = String(C * (1 - part));
      num.textContent = String(value);
      return;
    }
    const state = { p: 0 };
    const tween = gsap.to(state, {
      p: 1,
      duration: 1.4,
      ease: 'power3.out',
      onUpdate: () => {
        arc.style.strokeDashoffset = String(C * (1 - part * state.p));
        num.textContent = String(Math.round(value * state.p));
      },
    });
    return () => {
      tween.kill();
    };
  }, [value, part, reduced]);

  return (
    <span className="relative block h-28 w-28">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={R} fill="none" stroke="rgb(233 235 242 / 0.08)" strokeWidth="5" />
        <circle cx="50" cy="50" r={R} fill="none" stroke="rgb(233 235 242 / 0.1)" strokeWidth="1" strokeDasharray="1 5.9" transform="scale(0.86) translate(8.1 8.1)" />
        <circle ref={arcRef} cx="50" cy="50" r={R} fill="none" stroke="#f5a35c" strokeWidth="5" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C} />
      </svg>
      <span ref={numRef} className="absolute inset-0 grid place-items-center font-mono text-3xl text-ink">
        0
      </span>
    </span>
  );
}

/** What is behind a gauge: its summary, and each item leading somewhere. */
function Detail({ gauge, onClose }: { gauge: Gauge; onClose: () => void }) {
  const { open } = useBrowser();
  return (
    <section
      id="gauge-detail"
      aria-label={gauge.label}
      className="relative mt-4 overflow-hidden rounded-3xl border border-accent/30 bg-surface/70 p-6 shadow-[0_0_40px_rgb(245_163_92/0.08)] sm:p-8"
      style={{ animation: 'guide-in 320ms ease-out both' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] tracking-[0.2em] text-accent uppercase">
            {gauge.value} · {gauge.label}
          </p>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-ink/90">{gauge.summary}</p>
        </div>
        <button type="button" onClick={onClose} aria-label={COPY.close} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/[0.1] text-ink-muted hover:text-ink">
          <X className="h-4 w-4" />
        </button>
      </div>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {gauge.items.map((item, i) => {
          const body = (
            <>
              <span className="font-mono text-[10px] text-accent/80">{String(i + 1).padStart(2, '0')}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-ink">{item.label}</span>
                {item.note && <span className="mt-0.5 block text-xs leading-snug text-ink-muted">{item.note}</span>}
              </span>
              {item.href ? <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-muted" /> : item.to ? <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5" /> : null}
            </>
          );
          const cls = 'group flex w-full items-start gap-3 rounded-xl border border-white/[0.08] bg-space/50 p-4 text-left transition-colors';
          return (
            <li key={item.label} style={{ animation: `guide-in 300ms ease-out ${i * 50}ms both` }}>
              {item.href ? (
                <a href={item.href} target="_blank" rel="noopener noreferrer" className={`${cls} hover:border-accent/50`}>
                  {body}
                </a>
              ) : item.to ? (
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    open(item.to!);
                  }}
                  className={`${cls} hover:border-accent/50`}
                >
                  {body}
                </button>
              ) : (
                <div className={cls}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Amogh Control: a control panel of gauges that open up, and a live test of the visitor's own voice speed. */
export default function Control() {
  const reduced = useReducedMotion();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const reading = useWisprInput(inputRef);
  const wpm = reading?.wpm ?? 0;
  const gauge = GAUGES.find((g) => g.id === selected);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-6 pb-16 sm:px-8 sm:pt-8 xl:px-12 2xl:max-w-[1440px]">
      <header className="max-w-xl">
        <p className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">{COPY.eyebrow}</p>
        <h1 className="mt-2 font-display text-5xl text-ink sm:text-6xl">{COPY.title}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">{COPY.lead}</p>
      </header>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {GAUGES.map((g) => {
          const on = g.id === selected;
          return (
            <button
              key={g.id}
              type="button"
              aria-expanded={on}
              aria-controls="gauge-detail"
              onClick={() => {
                playClick();
                setSelected(on ? null : g.id);
              }}
              className={`hud-ticks gx-tile relative flex flex-col items-center gap-3 rounded-2xl border p-5 ${on ? 'border-accent/60 bg-accent/[0.08] shadow-[0_0_30px_rgb(245_163_92/0.15)]' : 'border-white/[0.08] bg-surface/60'}`}
            >
              <Ring value={g.value} max={g.value} reduced={reduced} />
              <span className="text-center font-mono text-[10.5px] tracking-[0.14em] text-ink-muted uppercase">{g.label}</span>
              <span className={`font-mono text-[10px] ${on ? 'text-accent' : 'text-ink-muted/70'}`}>{on ? COPY.close : COPY.open}</span>
            </button>
          );
        })}
      </div>

      {gauge && <Detail key={gauge.id} gauge={gauge} onClose={() => setSelected(null)} />}

      <section className="mt-4 grid gap-6 rounded-3xl border border-white/[0.08] bg-surface/60 p-6 md:grid-cols-[auto_1fr] md:items-center">
        <div className="flex flex-col items-center gap-2">
          <Ring key={reading?.at ?? 0} value={wpm} max={WPM_MAX} reduced={reduced} />
          <span className="font-mono text-[10.5px] tracking-[0.14em] text-ink-muted uppercase">{COPY.wpmTitle}</span>
        </div>
        <div className="flex flex-col gap-3">
          <p className="font-mono text-xs text-ink-muted">{reading?.wpm ? `~${reading.wpm} WPM · ${COPY.wpmTyping} · ${COPY.wpmEstimated}` : COPY.wpmNone}</p>
          <div className="relative h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="absolute inset-y-0 left-0 rounded-full bg-accent transition-[width] duration-700" style={{ width: `${Math.min(100, (wpm / WPM_MAX) * 100)}%` }} />
            <div className="absolute inset-y-0 w-px bg-ink" style={{ left: `${(TYPING_WPM / WPM_MAX) * 100}%` }} title={COPY.wpmTyping} />
          </div>
          <label className="flex items-start gap-2 rounded-xl border border-white/[0.08] bg-space/60 p-3 focus-within:border-accent/40">
            <Mic className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={1.8} aria-hidden="true" />
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              aria-label={COPY.wpmLabel}
              placeholder={COPY.wpmHint}
              rows={2}
              className="min-w-0 flex-1 resize-none bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted/70 focus-visible:outline-none"
            />
          </label>
          <WisprHint />
        </div>
      </section>
    </div>
  );
}
