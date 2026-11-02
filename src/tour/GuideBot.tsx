import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent, type PointerEvent } from 'react';
import { ChevronRight, ListChecks, Mic, Send, X } from 'lucide-react';
import { GUIDE, TIPS, tourLines } from '../content/guide';
import { VOICE } from '../content/voice';
import { toggleFullscreen } from '../lib/fullscreen';
import { playerName } from '../lib/player';
import { downloadResume } from '../lib/resume';
import { playClick, playTick } from '../lib/sound';
import { useReducedMotion } from '../lib/useReducedMotion';
import { useWisprInput } from '../voice/useWisprInput';
import { answer, byteMenu } from './answer';
import BotSprite from './BotSprite';
import { guide, useGuide, type Place } from './guide';

/** How long each line of the tour stays up; the last one in a place a little longer. */
const LINE_MS = 4200;
const LAST_MS = 5200;
/** Long enough to read where Byte is going before it goes. */
const TRIP_MS = 1500;
/** An answer stays up this long, unless the visitor is typing the next question. */
const SAID_MS = 9000;
/** Wispr hands over a finished sentence; give it a beat, then send it. */
const VOICE_SEND_MS = 900;
/** A press that moves less than this is a click, not a drag. */
const DRAG_PX = 6;
const BOT = { w: 52, h: 56 };
const EDGE = 8;
/** Now and then, between 6 and 11 seconds apart, Byte does something on its own. */
const IDLE_MS = [6000, 11000] as const;
const IDLE_ACTS = ['hop', 'turn', 'wobble'] as const;
const ACT_MS = 860;

type Act = (typeof IDLE_ACTS)[number] | 'land';
type Point = { x: number; y: number };

/** Where Byte floats until it is moved: clear of the taskbar, the sidebar and the phone's bottom bar. */
const SPOT: Record<Place, string> = {
  title: '',
  street: 'bottom-4 left-4',
  cafe: 'bottom-4 left-4',
  link: '',
  boot: '',
  desktop: 'bottom-16 left-4',
  browser: 'bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-3 sm:bottom-10 sm:left-[4.5rem]',
};

const coarse = () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), Math.max(lo, hi));
const keepOnScreen = (p: Point): Point => ({ x: clamp(p.x, EDGE, window.innerWidth - BOT.w - EDGE), y: clamp(p.y, EDGE, window.innerHeight - BOT.h - EDGE) });

const BUTTON = 'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors';
const PRIMARY = `${BUTTON} bg-accent text-space hover:opacity-90`;
const SECONDARY = `${BUTTON} border border-white/[0.14] text-ink hover:border-accent/50 hover:text-accent`;

/** "Where is...?": typed, or dictated with Wispr and sent a beat after it lands. */
function AskByte({ onAsk }: { onAsk: (question: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState('');
  const voiceTimer = useRef(0);

  const send = (raw: string) => {
    window.clearTimeout(voiceTimer.current);
    if (!raw.trim()) return;
    setDraft('');
    onAsk(raw);
  };
  const sendRef = useRef(send);
  sendRef.current = send;

  useWisprInput(inputRef, () => {
    window.clearTimeout(voiceTimer.current);
    voiceTimer.current = window.setTimeout(() => sendRef.current(inputRef.current?.value ?? ''), VOICE_SEND_MS);
  });
  useEffect(() => () => window.clearTimeout(voiceTimer.current), []);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(draft);
  };

  return (
    <form onSubmit={onSubmit} className="mt-3">
      <div className="flex h-9 items-center gap-2 rounded-lg border border-white/[0.12] bg-space/70 pr-1 pl-2.5 focus-within:border-accent/50">
        <Mic className="h-3.5 w-3.5 shrink-0 text-accent" strokeWidth={2} aria-hidden="true" />
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => {
            window.clearTimeout(voiceTimer.current);
            setDraft(e.target.value);
          }}
          aria-label={GUIDE.askLabel}
          placeholder={GUIDE.askPlaceholder}
          enterKeyHint="go"
          autoComplete="off"
          className="h-full min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-muted/70 focus-visible:outline-none"
        />
        <button type="submit" disabled={!draft.trim()} aria-label={GUIDE.askSend} className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-accent text-space disabled:opacity-30">
          <Send className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>
      <p className="mt-1.5 font-mono text-[10px] text-ink-muted">{VOICE.hint}</p>
    </form>
  );
}

/**
 * Byte, everywhere after the title screen: on the street, in the cafe, on the
 * PC and in the browser. It narrates the walkthrough, tips those exploring,
 * and answers "where is...?" by taking the visitor there. It can be dragged
 * anywhere, and has a life of its own while it waits. Ctrl+B starts the
 * walkthrough from wherever you are.
 */
export default function GuideBot() {
  const g = useGuide();
  const reduced = useReducedMotion();
  const lines = tourLines(g.place);
  const hidden = g.place === 'title' || g.place === 'link' || g.place === 'boot';

  const botRef = useRef<HTMLButtonElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Point | null>(null);
  const [held, setHeld] = useState(false);
  const [tilt, setTilt] = useState(0);
  const [act, setAct] = useState<{ name: Act; at: number } | null>(null);
  const [talking, setTalking] = useState(false);
  const [showList, setShowList] = useState(false);
  const drag = useRef<{ id: number; dx: number; dy: number; sx: number; sy: number; lastX: number; moved: boolean } | null>(null);
  const wasDragged = useRef(false);
  const tripTimer = useRef(0);

  // Phones have no Ctrl+B to mention.
  const touch = coarse();
  const tip = TIPS[g.place];
  const line = g.said ?? (g.mode === 'tour' ? lines[g.line] : tip ? (touch ? tip.touch : tip.keys) : null);
  // A visitor who said their name on the title screen is greeted with it, once, on the street.
  const name = playerName();
  const greet = name && line && !g.said && g.place === 'street' && (g.mode === 'explore' || g.line === 0);
  const text = greet ? `${GUIDE.hi(name)} ${line}` : line;
  const showBubble = Boolean(g.open && text);

  useEffect(() => {
    if (!showBubble) setShowList(false);
  }, [showBubble]);

  const play = useCallback(
    (name: Act) => {
      if (!reduced) setAct({ name, at: Date.now() });
    },
    [reduced],
  );

  // The shortcut works everywhere, game included.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        playClick();
        guide.toggle();
      } else if (e.key === 'Escape' && guide.get().mode === 'tour') {
        guide.explore();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // The tour's narration runs itself; the browser's last line ends the tour.
  useEffect(() => {
    if (g.mode !== 'tour' || hidden || !lines.length) return;
    if (g.narrated && g.place === 'browser') {
      const t = window.setTimeout(() => {
        guide.explore();
        guide.setOpen(false);
      }, 400);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => guide.advance(lines.length), g.line === lines.length - 1 ? LAST_MS : LINE_MS);
    return () => window.clearTimeout(t);
  }, [g.mode, g.place, g.line, g.narrated, hidden, lines.length]);

  // An answer has had its moment; the next question can bring Byte back.
  useEffect(() => {
    if (!g.said) return;
    const t = window.setTimeout(() => {
      if (!bubbleRef.current?.contains(document.activeElement)) guide.setOpen(false);
    }, SAID_MS);
    return () => window.clearTimeout(t);
  }, [g.said]);

  // Byte's mouth moves while a new line goes up.
  useEffect(() => {
    if (!showBubble || !text) return;
    setTalking(true);
    const t = window.setTimeout(() => setTalking(false), Math.min(2600, 500 + text.length * 22));
    return () => window.clearTimeout(t);
  }, [showBubble, text]);

  // A life of its own: a hop, a turn, a wobble, now and then.
  useEffect(() => {
    if (reduced || hidden || held) return;
    let t = 0;
    const next = () => {
      t = window.setTimeout(() => {
        play(IDLE_ACTS[Math.floor(Math.random() * IDLE_ACTS.length)]);
        next();
      }, IDLE_MS[0] + Math.random() * (IDLE_MS[1] - IDLE_MS[0]));
    };
    next();
    return () => window.clearTimeout(t);
  }, [reduced, hidden, held, play]);

  useEffect(() => {
    if (!act) return;
    const t = window.setTimeout(() => setAct(null), ACT_MS);
    return () => window.clearTimeout(t);
  }, [act]);

  useEffect(() => () => window.clearTimeout(tripTimer.current), []);

  // Wherever Byte is, the bubble opens on the side with room for it.
  const placeBubble = useCallback(() => {
    const bot = botRef.current?.getBoundingClientRect();
    const bubble = bubbleRef.current;
    if (!bot || !bubble) return;
    const w = bubble.offsetWidth;
    const h = bubble.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = bot.right + 8;
    let top = bot.bottom - 28 - h;
    if (left + w > vw - EDGE) left = bot.left - 8 - w;
    if (left < EDGE) {
      // No room either side: above Byte, or below it near the top.
      left = clamp(bot.left + bot.width / 2 - w / 2, EDGE, vw - EDGE - w);
      top = bot.top - 8 - h >= EDGE ? bot.top - 8 - h : bot.bottom + 8;
    }
    bubble.style.left = `${left}px`;
    bubble.style.top = `${clamp(top, EDGE, vh - EDGE - h)}px`;
  }, []);

  useLayoutEffect(placeBubble);
  useEffect(() => {
    const onResize = () => {
      setPos((p) => p && keepOnScreen(p));
      placeBubble();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [placeBubble]);

  const onAsk = useCallback(
    (question: string) => {
      const reply = answer(question, guide.get().place, coarse());
      playTick();
      play('hop');
      guide.say(reply.text);
      window.clearTimeout(tripTimer.current);
      const action = reply.action;
      setShowList(action.kind === 'help');
      if (action.kind === 'go') tripTimer.current = window.setTimeout(() => guide.go(action.to), TRIP_MS);
      else if (action.kind === 'tour') tripTimer.current = window.setTimeout(guide.tour, TRIP_MS);
      else if (action.kind === 'fullscreen') toggleFullscreen();
      else if (action.kind === 'download') downloadResume();
    },
    [play],
  );

  /* -------------------------------------------------- picking Byte up ---- */

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    const r = e.currentTarget.getBoundingClientRect();
    drag.current = { id: e.pointerId, dx: e.clientX - r.left, dy: e.clientY - r.top, sx: e.clientX, sy: e.clientY, lastX: e.clientX, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    if (!d.moved) {
      if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < DRAG_PX) return;
      d.moved = true;
      setHeld(true);
    }
    setPos(keepOnScreen({ x: e.clientX - d.dx, y: e.clientY - d.dy }));
    setTilt((t) => clamp(t * 0.6 + (e.clientX - d.lastX) * 1.4, -22, 22));
    d.lastX = e.clientX;
  };

  const onPointerUp = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (!d.moved) return;
    wasDragged.current = true;
    setHeld(false);
    setTilt(0);
    play('land');
    playTick();
  };

  const onClick = () => {
    // The click that ends a drag is not a request for help.
    if (wasDragged.current) {
      wasDragged.current = false;
      return;
    }
    playClick();
    play('hop');
    guide.setOpen(!g.open);
  };

  if (hidden) return null;

  const actClass = act ? `bot-act-${act.name}` : '';
  // Moved to the right half, Byte's label goes on its left.
  const onRight = pos !== null && pos.x + BOT.w / 2 > window.innerWidth / 2;

  return (
    <div
      className={`pointer-events-none fixed z-[1500] ${pos ? '' : SPOT[g.place]}`}
      style={pos ? { left: pos.x, top: pos.y } : undefined}
      role="complementary"
      aria-label={GUIDE.label}
    >
      <button
        ref={botRef}
        type="button"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={onClick}
        aria-label={GUIDE.reopen}
        aria-expanded={showBubble}
        title={GUIDE.drag}
        className={`pointer-events-auto relative block touch-none ${held ? 'bot-held cursor-grabbing' : 'cursor-grab'}`}
      >
        <span className={`block ${held || reduced ? '' : 'bot-hover'}`}>
          <span key={act?.at} className={`bot-act block ${actClass}`} style={held ? { transform: `rotate(${tilt}deg) scale(1.08)` } : undefined}>
            <BotSprite talking={talking && !reduced} className="h-14 w-[3.25rem] drop-shadow-[0_6px_14px_rgba(0,0,0,0.6)]" />
          </span>
        </span>
        {/* Until it is opened, Byte says what it is for, on the side with room. */}
        {!showBubble && !held && (
          <span
            className={`absolute top-1/2 -translate-y-1/2 rounded-md border border-accent/40 bg-[#0d111c]/95 px-2 py-1 font-mono text-[10px] whitespace-nowrap text-accent shadow-[0_6px_18px_rgba(0,0,0,0.5)] ${onRight ? 'right-full mr-2' : 'left-full ml-2'}`}
            style={{ animation: 'fade-in 300ms ease-out both' }}
          >
            {touch ? GUIDE.tapMe : GUIDE.clickMe}
          </span>
        )}
      </button>

      {showBubble && (
        <div
          ref={bubbleRef}
          className="pointer-events-auto fixed w-[min(21rem,calc(100vw-1rem))] rounded-2xl border border-accent/25 bg-[#0d111c]/95 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.55),0_0_0_1px_rgb(245_163_92/0.08)] backdrop-blur"
          style={{ animation: 'guide-in 260ms ease-out both' }}
        >
          <p className="mb-1.5 font-mono text-[10px] tracking-[0.2em] text-accent uppercase">{GUIDE.name}</p>
          <button
            type="button"
            aria-label={g.mode === 'tour' && !g.said ? GUIDE.exitTour : GUIDE.gotIt}
            onClick={() => (g.mode === 'tour' ? guide.explore() : guide.setOpen(false))}
            className="absolute top-2.5 right-2.5 grid h-6 w-6 place-items-center rounded-md text-ink-muted hover:bg-white/10 hover:text-ink"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
          {/* A new line slides in; the question box below stays put, focus and all. */}
          <p key={`${g.mode}-${g.place}-${g.line}-${g.said ?? ''}`} aria-live="polite" className="pr-5 text-sm leading-relaxed text-ink" style={{ animation: 'guide-in 260ms ease-out both' }}>
            {text}
          </p>

          {g.mode === 'tour' && !g.said && (
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="flex gap-1" aria-hidden="true">
                {lines.map((_, i) => (
                  <span key={i} className={`h-1 w-4 rounded-full ${i <= g.line ? 'bg-accent' : 'bg-white/15'}`} />
                ))}
              </span>
              {!g.narrated && (
                <button type="button" onClick={() => guide.advance(lines.length)} className={`${SECONDARY} inline-flex items-center gap-1`}>
                  {GUIDE.next}
                  <ChevronRight className="h-3 w-3" strokeWidth={2} />
                </button>
              )}
            </div>
          )}

          {g.mode === 'explore' && !g.said && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => guide.setOpen(false)} className={PRIMARY}>
                {GUIDE.gotIt}
              </button>
              <button type="button" onClick={guide.tour} className={SECONDARY}>
                {GUIDE.startTour}
              </button>
            </div>
          )}

          {/* Everything Byte can do, so nobody has to guess the words. */}
          <button type="button" onClick={() => setShowList((v) => !v)} aria-expanded={showList} className="mt-3 inline-flex items-center gap-1.5 text-xs text-accent hover:underline">
            <ListChecks className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
            {showList ? GUIDE.hideList : GUIDE.list}
          </button>
          {showList && (
            <div className="mt-2 max-h-[min(17rem,38vh)] space-y-3 overflow-y-auto overscroll-contain pr-1">
              {byteMenu(g.place).map((group) => (
                <div key={group.title}>
                  <p className="font-mono text-[10px] tracking-[0.18em] text-ink-muted uppercase">{group.title}</p>
                  <ul className="mt-1">
                    {group.items.map((item) => (
                      <li key={item.example}>
                        <button type="button" onClick={() => onAsk(item.example)} className="group block w-full rounded-md px-2 py-1 text-left hover:bg-white/[0.06]">
                          <span className="block text-[12.5px] leading-snug text-ink group-hover:text-accent">“{item.example}”</span>
                          <span className="block text-[10.5px] text-ink-muted">→ {item.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <p className="text-[11px] text-ink-muted">{GUIDE.listTwin}</p>
            </div>
          )}

          <AskByte onAsk={onAsk} />
          {!touch && <p className="mt-2 border-t border-white/[0.06] pt-2 font-mono text-[10px] text-ink-muted">{GUIDE.shortcutHint}</p>}
        </div>
      )}
    </div>
  );
}
