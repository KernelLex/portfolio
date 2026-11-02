import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Mic } from 'lucide-react';
import { CONTROL as COPY, GAUGES } from '../../content/control';
import { useReducedMotion } from '../../lib/useReducedMotion';
import { useWisprInput } from '../../voice/useWisprInput';
import WisprHint from '../../voice/WisprHint';

const WPM_MAX = 300;
const TYPING_WPM = 40;

function Ring({ value, max, label, reduced }: { value: number; max: number; label: string; reduced: boolean }) {
  const arcRef = useRef<SVGCircleElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const r = 44;
  const c = 2 * Math.PI * r;
  const part = Math.min(1, value / max);

  useEffect(() => {
    const arc = arcRef.current;
    const num = numRef.current;
    if (!arc || !num) return;
    if (reduced) {
      arc.style.strokeDashoffset = String(c * (1 - part));
      num.textContent = String(value);
      return;
    }
    const state = { p: 0 };
    const tween = gsap.to(state, {
      p: 1,
      duration: 1.4,
      ease: 'power3.out',
      onUpdate: () => {
        arc.style.strokeDashoffset = String(c * (1 - part * state.p));
        num.textContent = String(Math.round(value * state.p));
      },
    });
    return () => {
      tween.kill();
    };
  }, [value, part, c, reduced]);

  return (
    <div className="hud-ticks relative flex flex-col items-center gap-3 rounded-2xl border border-white/[0.08] bg-surface/60 p-5">
      <div className="relative h-28 w-28">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgb(233 235 242 / 0.08)" strokeWidth="5" />
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgb(233 235 242 / 0.1)" strokeWidth="1" strokeDasharray="1 5.9" transform="scale(0.86) translate(8.1 8.1)" />
          <circle ref={arcRef} cx="50" cy="50" r={r} fill="none" stroke="#f5a35c" strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c} />
        </svg>
        <span ref={numRef} className="absolute inset-0 grid place-items-center font-mono text-3xl text-ink">
          0
        </span>
      </div>
      <p className="text-center font-mono text-[10.5px] tracking-[0.14em] text-ink-muted uppercase">{label}</p>
    </div>
  );
}

/** Amogh Control: a control panel of gauges, plus a live test of the visitor's own voice speed. */
export default function Control() {
  const reduced = useReducedMotion();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState('');
  const reading = useWisprInput(inputRef);
  const wpm = reading?.wpm ?? 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-16 sm:px-8 sm:pt-8">
      <header className="max-w-xl">
        <p className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">{COPY.eyebrow}</p>
        <h1 className="mt-2 font-display text-5xl text-ink sm:text-6xl">{COPY.title}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">{COPY.lead}</p>
      </header>

      <section className="hud-ticks relative mt-8 overflow-hidden rounded-3xl border border-accent/25 bg-[radial-gradient(ellipse_at_20%_0%,rgb(245_163_92/0.16),transparent_60%)] p-6 sm:p-8">
        <p className="font-mono text-[10.5px] tracking-[0.2em] text-accent uppercase">{COPY.recovered}</p>
        <p className="mt-2 font-mono text-5xl text-ink sm:text-7xl">₹2,15,867</p>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {GAUGES.map((g) => (
          <Ring key={g.label} value={g.value} max={g.value} label={g.label} reduced={reduced} />
        ))}
      </div>

      <section className="mt-4 grid gap-4 rounded-3xl border border-white/[0.08] bg-surface/60 p-6 md:grid-cols-[auto_1fr] md:items-center">
        <div className="flex flex-col items-center">
          <Ring key={reading?.at ?? 0} value={wpm} max={WPM_MAX} label={COPY.wpmTitle} reduced={reduced} />
        </div>
        <div className="flex flex-col gap-3">
          <p className="font-mono text-xs text-ink-muted">
            {reading?.wpm ? `~${reading.wpm} WPM · ${COPY.wpmTyping} · ${COPY.wpmEstimated}` : COPY.wpmNone}
          </p>
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
