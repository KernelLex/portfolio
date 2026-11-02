import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Check, Lock, Plug } from 'lucide-react';
import { PIECES, type Widget } from '../../content/story';
import { playClick, playJackIn, playPickup, playTick } from '../../lib/sound';

/** Every piece gets the same contract: is it done, and how to say it is. */
type PieceProps = { done: boolean; onDone: () => void; reduced: boolean };

const BOX = 'relative h-full min-h-[17rem] w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-space/70';
const ACTION = 'rounded-lg bg-accent px-4 py-2 text-sm font-medium text-space transition-opacity hover:opacity-90 disabled:opacity-30';

/** 1. Two doors: one is a corridor, one is open. */
function Fork({ done, onDone }: PieceProps) {
  const [refused, setRefused] = useState(false);
  return (
    <div className={`${BOX} grid grid-cols-2 gap-4 p-5`}>
      <button
        type="button"
        onClick={() => {
          playTick();
          setRefused(true);
        }}
        className={`flex flex-col items-center justify-end gap-3 rounded-xl border border-white/[0.1] bg-[repeating-linear-gradient(90deg,rgb(233_235_242/0.04)_0_2px,transparent_2px_14px)] p-4 text-sm text-ink-muted ${refused ? 'story-shake' : ''}`}
      >
        <Lock className="h-6 w-6" strokeWidth={1.6} />
        {PIECES.fork.engineering}
      </button>
      <button
        type="button"
        onClick={() => {
          playPickup();
          onDone();
        }}
        className={`flex flex-col items-center justify-end gap-3 rounded-xl border p-4 text-sm transition-all ${
          done ? 'border-accent bg-accent/15 text-accent shadow-[0_0_30px_rgb(245_163_92/0.25)]' : 'border-accent/40 text-ink hover:bg-accent/10'
        }`}
      >
        <span className={`h-16 w-16 rounded-full border-2 border-dashed ${done ? 'border-accent' : 'border-accent/50'}`} />
        {PIECES.fork.bsc}
      </button>
      {refused && !done && <p className="absolute inset-x-5 bottom-3 text-center font-mono text-xs text-ink-muted">{PIECES.fork.notThis}</p>}
    </div>
  );
}

/** 2. A classroom of desks; one of them gets up and leaves. */
function Classroom({ done, onDone }: PieceProps) {
  return (
    <div className={`${BOX} flex flex-col items-center justify-center gap-6 p-5`}>
      <div className="relative grid grid-cols-5 gap-3">
        {Array.from({ length: 15 }, (_, i) => (
          <span
            key={i}
            className={`h-7 w-10 rounded-md border transition-all duration-700 ${
              i === 12
                ? `border-accent bg-accent ${done ? 'translate-x-[9rem] -translate-y-24 opacity-0' : ''}`
                : `border-white/20 ${done ? 'opacity-15' : ''}`
            }`}
            style={{ transitionDelay: i === 12 ? '500ms' : `${i * 30}ms` }}
          />
        ))}
      </div>
      <button
        type="button"
        disabled={done}
        onClick={() => {
          playClick();
          onDone();
        }}
        className={ACTION}
      >
        {PIECES.classroom.button}
      </button>
    </div>
  );
}

const MONTHS = 6;

/** 3. Pitch, and pitch, and pitch: six months of no, then one yes. */
function Pitch({ done, onDone }: PieceProps) {
  const [sent, setSent] = useState(done ? MONTHS : 0);
  return (
    <div className={`${BOX} flex flex-col items-center justify-center gap-5 p-5`}>
      <div className="flex gap-2">
        {Array.from({ length: MONTHS }, (_, i) => (
          <span key={i} className={`rounded-md border px-2 py-1 font-mono text-[10px] ${i < sent ? 'border-accent/60 text-accent' : 'border-white/15 text-ink-muted'}`}>
            {PIECES.pitch.month(i + 1)}
          </span>
        ))}
      </div>
      <div className="relative h-24 w-56">
        {Array.from({ length: sent }, (_, i) => (
          <div
            key={i}
            className="absolute inset-0 rounded-lg border border-white/15 bg-surface p-3"
            style={{ transform: `translate(${i * 4}px, ${-i * 4}px) rotate(${(i % 2 ? 1 : -1) * (2 + i)}deg)` }}
          >
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 rounded border-2 border-[#ff5fa2] px-2 font-condensed text-2xl text-[#ff5fa2] uppercase">
              {PIECES.pitch.rejected}
            </span>
          </div>
        ))}
        {done && (
          <p className="absolute inset-0 z-10 grid place-items-center rounded-lg border border-accent bg-[#2a1d12] font-display text-2xl text-accent shadow-[0_0_30px_rgb(245_163_92/0.3)]" style={{ animation: 'guide-in 400ms ease-out both' }}>
            {PIECES.pitch.yes}
          </p>
        )}
      </div>
      <button
        type="button"
        disabled={done}
        onClick={() => {
          playTick();
          const n = sent + 1;
          setSent(n);
          if (n >= MONTHS) window.setTimeout(onDone, 500);
        }}
        className={ACTION}
      >
        {PIECES.pitch.button}
      </button>
    </div>
  );
}

/** 4. A wireframe building to turn around. */
function Wireframe({ done, onDone, reduced }: PieceProps) {
  const [angle, setAngle] = useState(-25);
  const turned = useRef(0);
  const drag = useRef<number | null>(null);
  const turn = (by: number) => {
    setAngle((a) => a + by);
    turned.current += Math.abs(by);
    if (!done && turned.current > 140) onDone();
  };
  const faces: [string, string][] = [
    ['translateZ(48px)', ''],
    ['rotateY(90deg) translateZ(48px)', ''],
    ['rotateY(180deg) translateZ(48px)', ''],
    ['rotateY(-90deg) translateZ(48px)', ''],
  ];
  return (
    <div
      className={`${BOX} flex cursor-grab touch-none flex-col items-center justify-center gap-4 select-none active:cursor-grabbing`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') turn(-20);
        if (e.key === 'ArrowRight') turn(20);
      }}
      onPointerDown={(e) => {
        drag.current = e.clientX;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (drag.current === null) return;
        turn((e.clientX - drag.current) * 0.6);
        drag.current = e.clientX;
      }}
      onPointerUp={() => (drag.current = null)}
    >
      <div className="[perspective:600px]">
        <div
          className="relative h-40 w-24 [transform-style:preserve-3d]"
          style={{ transform: `rotateX(-12deg) rotateY(${angle}deg)`, transition: reduced ? undefined : 'transform 80ms linear' }}
        >
          {faces.map(([t], i) => (
            <div
              key={i}
              className="absolute inset-0 border-2 border-accent/80 bg-[repeating-linear-gradient(0deg,rgb(245_163_92/0.14)_0_1px,transparent_1px_20px),repeating-linear-gradient(90deg,rgb(245_163_92/0.14)_0_1px,transparent_1px_24px)]"
              style={{ transform: t }}
            />
          ))}
          <div className="absolute inset-x-0 top-0 h-24 border-2 border-accent bg-accent/10" style={{ transform: 'rotateX(90deg) translateZ(0px) translateY(-48px)', transformOrigin: 'top' }} />
        </div>
      </div>
      <p className="font-mono text-[11px] text-ink-muted">
        {PIECES.wireframe.label} · {PIECES.wireframe.hint}
      </p>
    </div>
  );
}

/** 5. A dark room and a spotlight; the message is waiting in the dark. */
function Spotlight({ done, onDone }: PieceProps) {
  const [at, setAt] = useState({ x: 20, y: 30 });
  const moves = useRef(0);
  const move = (e: ReactPointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setAt({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
    moves.current += 1;
    if (!done && moves.current > 40) onDone();
  };
  return (
    <div className={`${BOX} touch-none`} onPointerMove={move} onPointerDown={move}>
      <div className="absolute inset-0 grid place-items-center p-8 text-center">
        <div>
          <p className="font-display text-3xl leading-tight text-ink sm:text-4xl">{PIECES.spotlight.hidden}</p>
          <p className="mt-3 font-mono text-[11px] tracking-[0.2em] text-accent uppercase">{PIECES.spotlight.label}</p>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{
          background: `radial-gradient(circle 110px at ${at.x}% ${at.y}%, transparent 0, rgb(5 6 13 / 0.6) 55%, rgb(5 6 13 / 0.97) 100%)`,
          opacity: done ? 0 : 1,
        }}
      />
      {!done && <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center font-mono text-[11px] text-ink-muted">{PIECES.spotlight.hint}</p>}
    </div>
  );
}

/** 6. Three cards to turn over. */
function Cards({ done, onDone }: PieceProps) {
  const [flipped, setFlipped] = useState<boolean[]>(() => PIECES.cards.faces.map(() => done));
  return (
    <div className={`${BOX} grid grid-cols-3 gap-3 p-5`}>
      {PIECES.cards.faces.map((face, i) => (
        <button
          key={face}
          type="button"
          onClick={() => {
            playClick();
            const next = flipped.map((f, j) => f || j === i);
            setFlipped(next);
            if (next.every(Boolean)) onDone();
          }}
          className="[perspective:600px]"
        >
          <span className="relative block h-full min-h-40 transition-transform duration-500 [transform-style:preserve-3d]" style={{ transform: flipped[i] ? 'rotateY(180deg)' : 'none' }}>
            <span className="absolute inset-0 grid place-items-center rounded-xl border border-white/15 bg-[repeating-linear-gradient(45deg,rgb(245_163_92/0.1)_0_6px,transparent_6px_12px)] font-mono text-xs text-ink-muted [backface-visibility:hidden]">
              {PIECES.cards.back}
            </span>
            <span
              className={`absolute inset-0 grid place-items-center rounded-xl border p-2 text-sm [backface-visibility:hidden] ${i === 2 ? 'border-white/15 text-ink-muted line-through' : 'border-accent/50 bg-accent/10 text-ink'}`}
              style={{ transform: 'rotateY(180deg)' }}
            >
              {face}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

const SCATTER = [
  [8, 12],
  [70, 8],
  [4, 62],
  [74, 64],
  [40, 4],
  [42, 74],
];

/** 7. Six systems scattered around; click each into the one place. */
function Merge({ done, onDone }: PieceProps) {
  const [inside, setInside] = useState<boolean[]>(() => PIECES.merge.panels.map(() => done));
  return (
    <div className={BOX}>
      <div
        className={`absolute top-1/2 left-1/2 grid h-24 w-40 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-xl border-2 transition-all duration-500 ${
          done ? 'scale-110 border-accent bg-accent/15 text-accent shadow-[0_0_40px_rgb(245_163_92/0.3)]' : 'border-dashed border-accent/40 text-ink-muted'
        }`}
      >
        <span className="font-mono text-sm">{PIECES.merge.hub}</span>
      </div>
      {PIECES.merge.panels.map((label, i) => (
        <button
          key={label}
          type="button"
          disabled={inside[i]}
          onClick={() => {
            playTick();
            const next = inside.map((v, j) => v || j === i);
            setInside(next);
            if (next.every(Boolean)) window.setTimeout(onDone, 450);
          }}
          className="absolute rounded-lg border border-white/20 bg-surface px-3 py-2 font-mono text-xs text-ink transition-all duration-500 hover:border-accent/60"
          style={
            inside[i]
              ? { left: '50%', top: '50%', transform: 'translate(-50%, -50%) scale(0.3)', opacity: 0 }
              : { left: `${SCATTER[i][0]}%`, top: `${SCATTER[i][1]}%` }
          }
        >
          {label}
        </button>
      ))}
    </div>
  );
}

const NODES = [
  [16, 20],
  [84, 20],
  [50, 86],
];

/** 8. A hub and three companies to connect. */
function Hub({ done, onDone }: PieceProps) {
  const [linked, setLinked] = useState<boolean[]>(() => PIECES.hub.companies.map(() => done));
  return (
    <div className={BOX}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
        {NODES.map(([x, y], i) => (
          <line key={i} x1="50" y1="50" x2={x} y2={y} stroke={linked[i] ? '#f5a35c' : 'rgb(233 235 242 / 0.12)'} strokeWidth="0.6" strokeDasharray={linked[i] ? undefined : '2 2'} vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div className={`absolute top-1/2 left-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 font-mono text-[11px] ${done ? 'border-accent bg-accent/15 text-accent' : 'border-accent/50 text-ink'}`}>
        {PIECES.hub.centre}
      </div>
      {PIECES.hub.companies.map((name, i) => (
        <button
          key={name}
          type="button"
          onClick={() => {
            playTick();
            const next = linked.map((v, j) => v || j === i);
            setLinked(next);
            if (next.every(Boolean)) onDone();
          }}
          className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-3 py-1.5 text-xs transition-colors ${linked[i] ? 'border-accent bg-accent/15 text-accent' : 'border-white/20 bg-surface text-ink hover:border-accent/60'}`}
          style={{ left: `${NODES[i][0]}%`, top: `${NODES[i][1]}%` }}
        >
          {name}
        </button>
      ))}
      {done && (
        <p className="absolute top-[64%] left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-accent/40 bg-space/90 px-3 py-1 font-mono text-[10.5px] whitespace-nowrap text-accent" style={{ animation: 'guide-in 400ms ease-out both' }}>
          <Lock className="h-3 w-3" />
          {PIECES.hub.ai}
        </p>
      )}
    </div>
  );
}

/** 9. Drag the HR module's plug across into the client's ERP. */
function PlugIn({ done, onDone }: PieceProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [plug, setPlug] = useState<{ x: number; y: number } | null>(null);
  const socket = { x: 78, y: 50 };
  const home = { x: 30, y: 50 };
  const pos = done ? socket : (plug ?? home);
  const drop = () => {
    if (plug && Math.hypot(plug.x - socket.x, plug.y - socket.y) < 12) {
      playJackIn();
      onDone();
    }
    setPlug(null);
  };
  return (
    <div
      ref={boxRef}
      className={`${BOX} touch-none select-none`}
      onPointerMove={(e) => {
        if (!plug || done) return;
        const r = boxRef.current!.getBoundingClientRect();
        setPlug({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
      }}
      onPointerUp={drop}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <path d={`M 22 50 Q ${(22 + pos.x) / 2} ${Math.max(pos.y, 50) + 18} ${pos.x} ${pos.y}`} fill="none" stroke="#f5a35c" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="absolute top-1/2 left-[4%] grid h-24 w-[18%] -translate-y-1/2 place-items-center rounded-xl border border-accent/50 bg-accent/10 p-2 text-center text-xs text-ink">{PIECES.plug.module}</div>
      <button
        type="button"
        onClick={() => !done && (playJackIn(), onDone())}
        className={`absolute top-1/2 right-[4%] grid h-24 w-[18%] -translate-y-1/2 place-items-center rounded-xl border p-2 text-center text-xs ${done ? 'border-accent bg-accent/15 text-accent' : 'border-white/20 bg-surface text-ink'}`}
      >
        {PIECES.plug.erp}
      </button>
      <span
        role="button"
        tabIndex={0}
        aria-label={PIECES.plug.hint}
        onPointerDown={(e) => {
          if (done) return;
          e.currentTarget.parentElement?.setPointerCapture(e.pointerId);
          setPlug(home);
        }}
        onKeyDown={(e) => e.key === 'Enter' && !done && (playJackIn(), onDone())}
        className={`absolute grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-lg border-2 ${done ? 'border-accent bg-accent text-space' : 'cursor-grab border-accent bg-space text-accent'}`}
        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
      >
        <Plug className="h-4 w-4" strokeWidth={2} />
      </span>
      <p className="absolute inset-x-0 bottom-3 text-center font-mono text-[11px] text-ink-muted">{done ? PIECES.plug.joined : PIECES.plug.hint}</p>
    </div>
  );
}

/** 10. Three reasons to light up. */
function Why({ done, onDone }: PieceProps) {
  const [lit, setLit] = useState<boolean[]>(() => PIECES.why.map(() => done));
  return (
    <div className={`${BOX} flex flex-col justify-center gap-3 p-5`}>
      {PIECES.why.map((reason, i) => (
        <button
          key={reason}
          type="button"
          onClick={() => {
            playPickup();
            const next = lit.map((v, j) => v || j === i);
            setLit(next);
            if (next.every(Boolean)) onDone();
          }}
          className={`flex items-center justify-between rounded-xl border px-4 py-3.5 text-left font-display text-2xl transition-all ${
            lit[i] ? 'border-accent bg-accent/10 text-ink shadow-[0_0_24px_rgb(245_163_92/0.2)]' : 'border-white/10 text-ink-muted hover:border-white/25'
          }`}
        >
          {reason}
          {lit[i] && <Check className="h-5 w-5 text-accent" strokeWidth={2} />}
        </button>
      ))}
    </div>
  );
}

/** 11. The end, which is not one. */
function End({ done, onDone }: PieceProps) {
  const [typed, setTyped] = useState(done ? PIECES.end.length : 0);
  useEffect(() => {
    if (typed >= PIECES.end.length) {
      if (!done) onDone();
      return;
    }
    const t = window.setTimeout(() => setTyped((n) => n + 1), 90);
    return () => window.clearTimeout(t);
  }, [typed, done, onDone]);
  return (
    <div className={`${BOX} grid place-items-center p-6`}>
      <p className="font-mono text-2xl text-ink">
        <span className="text-accent">$ </span>
        {PIECES.end.slice(0, typed)}
        <span className="story-caret ml-1 inline-block h-6 w-3 translate-y-1 bg-accent" />
      </p>
    </div>
  );
}

const PIECE_FOR: Record<Widget, (p: PieceProps) => React.ReactNode> = {
  fork: Fork,
  classroom: Classroom,
  pitch: Pitch,
  wireframe: Wireframe,
  spotlight: Spotlight,
  cards: Cards,
  merge: Merge,
  hub: Hub,
  plug: PlugIn,
  why: Why,
  end: End,
};

export function Piece({ widget, ...props }: PieceProps & { widget: Widget }) {
  const Component = PIECE_FOR[widget];
  return <Component {...props} />;
}
