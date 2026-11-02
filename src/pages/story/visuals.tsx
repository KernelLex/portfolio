import gsap from 'gsap';
import type { ReactNode } from 'react';
import { VISUAL_TEXT as T, type SceneVisual } from '../../content/story';

/**
 * The drawings for each scene: plain SVG, animated by data attributes so each
 * drawing stays declarative.
 *   data-anim="draw"  strokes draw themselves      data-anim="pop"   scale in
 *   data-anim="fade"  rise and fade in              data-anim="dim"   fade to a ghost
 *   data-anim="move"  slide by data-x / data-y      data-anim="beam"  swing in from data-origin
 * data-at sets when (in seconds) within the scene's timeline.
 */
export function animateVisual(root: Element): gsap.core.Timeline {
  const tl = gsap.timeline();
  root.querySelectorAll<SVGElement & HTMLElement>('[data-anim]').forEach((el) => {
    const at = Number(el.dataset.at ?? 0);
    switch (el.dataset.anim) {
      case 'draw': {
        const length = (el as unknown as SVGGeometryElement).getTotalLength();
        tl.fromTo(el, { strokeDasharray: length, strokeDashoffset: length }, { strokeDashoffset: 0, duration: Number(el.dataset.dur ?? 1.1), ease: 'power2.inOut' }, at);
        break;
      }
      case 'pop':
        tl.from(el, { scale: 0, opacity: 0, transformOrigin: '50% 50%', duration: 0.55, ease: 'back.out(1.8)' }, at);
        break;
      case 'fade':
        tl.from(el, { opacity: 0, y: 14, duration: 0.7, ease: 'power2.out' }, at);
        break;
      case 'dim':
        tl.to(el, { opacity: 0.12, duration: 0.7, ease: 'power1.inOut' }, at);
        break;
      case 'move':
        tl.to(el, { x: Number(el.dataset.x ?? 0), y: Number(el.dataset.y ?? 0), duration: 1.1, ease: 'power3.inOut' }, at);
        break;
      case 'beam':
        tl.fromTo(el, { rotation: -32, opacity: 0 }, { rotation: 0, opacity: 1, svgOrigin: el.dataset.origin, duration: 1.5, ease: 'power2.out' }, at);
        break;
    }
  });
  return tl;
}

const INK = '#e9ebf2';
const DIM = 'rgb(233 235 242 / 0.25)';
const AMBER = '#f5a35c';
const label = { fill: INK, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, letterSpacing: 1 } as const;

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full overflow-visible" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

const VISUALS: Record<SceneVisual, () => ReactNode> = {
  paths: () => (
    <Svg>
      <path d="M200 270 L130 70" stroke={DIM} strokeWidth="2" data-anim="draw" />
      <path d="M186 270 L118 74 M214 270 L142 66" stroke={DIM} strokeWidth="1" strokeDasharray="3 6" />
      <path d="M200 270 C 250 210, 340 200, 300 70" stroke={AMBER} strokeWidth="3" data-anim="draw" data-at="0.4" data-dur="1.6" />
      <circle cx="200" cy="270" r="6" fill={INK} data-anim="pop" />
      <circle cx="300" cy="70" r="7" fill={AMBER} data-anim="pop" data-at="1.9" />
      <text x="96" y="52" {...label} fill={DIM} data-anim="fade" data-at="0.6">{T.paths.closed}</text>
      <text x="236" y="48" {...label} fill={AMBER} data-anim="fade" data-at="1.8">{T.paths.open}</text>
    </Svg>
  ),
  classroom: () => (
    <Svg>
      {Array.from({ length: 15 }, (_, i) => (
        <rect key={i} x={70 + (i % 5) * 52} y={70 + Math.floor(i / 5) * 56} width="30" height="22" rx="4" stroke={INK} strokeWidth="1.5" data-anim="dim" data-at={0.3 + i * 0.07} />
      ))}
      <rect x="174" y="182" width="30" height="22" rx="4" fill={AMBER} data-anim="move" data-x="150" data-y="-10" data-at="1.6" />
    </Svg>
  ),
  zero: () => (
    <Svg>
      <text x="200" y="190" textAnchor="middle" fill={INK} fontFamily="Instrument Serif, serif" fontSize="150" data-anim="fade">0</text>
      <text x="200" y="222" textAnchor="middle" {...label} fill={DIM}>{T.zero.clients}</text>
      {Array.from({ length: 6 }, (_, i) => (
        <g key={i} data-anim="pop" data-at={0.3 + i * 0.25}>
          <circle cx={75 + i * 50} cy="40" r="15" stroke={DIM} strokeWidth="1.5" />
          <text x={75 + i * 50} y="44" textAnchor="middle" {...label} fontSize="10">{T.zero.month(i + 1)}</text>
        </g>
      ))}
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={60 + i * 105} y="250" width="70" height="30" rx="5" stroke={DIM} strokeWidth="1.5" data-anim="fade" data-at={0.5 + i * 0.4} />
          <text x={95 + i * 105} y="269" textAnchor="middle" {...label} fill={DIM} fontSize="10">{T.zero.pitch}</text>
          <path d={`M${55 + i * 105} 266 L${135 + i * 105} 264`} stroke={AMBER} strokeWidth="2" data-anim="draw" data-at={1 + i * 0.4} data-dur="0.4" />
        </g>
      ))}
    </Svg>
  ),
  wireframe: () => (
    <Svg>
      {[
        'M120 230 L200 270 L280 230 L200 190 Z',
        'M120 230 L120 110 M200 270 L200 150 M280 230 L280 110 M200 190 L200 70',
        'M120 110 L200 150 L280 110 L200 70 Z',
        'M120 170 L200 210 L280 170',
        'M160 250 L160 130 M240 250 L240 130',
      ].map((d, i) => (
        <path key={d} d={d} stroke={i === 2 ? AMBER : INK} strokeWidth={i === 2 ? 2.5 : 1.5} data-anim="draw" data-at={i * 0.35} />
      ))}
      <text x="200" y="295" textAnchor="middle" {...label} fill={AMBER} data-anim="fade" data-at="1.7">{T.wireframe}</text>
    </Svg>
  ),
  beams: () => (
    <Svg>
      <defs>
        <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={AMBER} stopOpacity="0.85" />
          <stop offset="1" stopColor={AMBER} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[110, 200, 290].map((x, i) => (
        <g key={x}>
          <path d={`M${x} 40 L${x - 55} 280 L${x + 55} 280 Z`} fill="url(#beam)" opacity="0.5" data-anim="beam" data-origin={`${x} 40`} data-at={i * 0.3} />
          <rect x={x - 14} y="30" width="28" height="12" rx="3" fill={INK} data-anim="pop" data-at={i * 0.3} />
        </g>
      ))}
      <text x="200" y="295" textAnchor="middle" {...label} fill={INK} data-anim="fade" data-at="1.4">{T.beams}</text>
    </Svg>
  ),
  weddings: () => (
    <Svg>
      {T.weddings.kept.map((name, i) => (
        <g key={name} data-anim="pop" data-at={i * 0.35}>
          <rect x={60 + i * 150} y="70" width="130" height="90" rx="10" stroke={AMBER} strokeWidth="1.8" fill="rgb(245 163 92 / 0.06)" />
          <text x={125 + i * 150} y="120" textAnchor="middle" {...label} fontSize="12">{name}</text>
        </g>
      ))}
      {[0, 1].map((i) => (
        <g key={i} data-anim="move" data-x={i ? 60 : -60} data-y="30" data-at={1.1}>
          <g data-anim="dim" data-at="1.1">
            <rect x={90 + i * 150} y="190" width="90" height="60" rx="8" stroke={INK} strokeWidth="1.2" strokeDasharray="4 5" />
            <text x={135 + i * 150} y="224" textAnchor="middle" {...label} fill={DIM} fontSize="10">{T.weddings.lost}</text>
          </g>
        </g>
      ))}
    </Svg>
  ),
  merge: () => (
    <Svg>
      {[
        [40, 40], [290, 30], [60, 210], [300, 200], [170, 20], [180, 240],
      ].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="70" height="46" rx="6" stroke={INK} strokeWidth="1.3" fill="rgb(233 235 242 / 0.04)" data-anim="move" data-x={165 - x} data-y={127 - y} data-at={0.6 + i * 0.08} />
      ))}
      <rect x="120" y="95" width="160" height="110" rx="12" stroke={AMBER} strokeWidth="2.2" fill="rgb(245 163 92 / 0.07)" data-anim="pop" data-at="1.9" />
    </Svg>
  ),
  hub: () => (
    <Svg>
      {T.hub.companies.map((name, i) => {
        const [x, y] = [[70, 60], [330, 60], [200, 270]][i];
        return (
          <g key={name}>
            <path d={`M200 150 L${x} ${y}`} stroke={DIM} strokeWidth="1.5" data-anim="draw" data-at={0.5 + i * 0.25} data-dur="0.6" />
            <circle cx={x} cy={y} r="8" fill={INK} data-anim="pop" data-at={0.9 + i * 0.25} />
            <text x={x} y={y + (y > 150 ? 24 : -16)} textAnchor="middle" {...label} fontSize="10" data-anim="fade" data-at={1 + i * 0.25}>{name}</text>
          </g>
        );
      })}
      <circle cx="200" cy="150" r="42" stroke={AMBER} strokeWidth="2.5" fill="rgb(245 163 92 / 0.08)" data-anim="pop" />
      <text x="200" y="154" textAnchor="middle" {...label} fill={AMBER} fontSize="12">{T.hub.centre}</text>
      <g data-anim="pop" data-at="1.9">
        <rect x="236" y="168" width="150" height="24" rx="12" fill="#141a26" stroke={AMBER} strokeWidth="1" />
        <text x="311" y="184" textAnchor="middle" {...label} fill={AMBER} fontSize="9.5">{T.hub.ai}</text>
      </g>
    </Svg>
  ),
  link: () => (
    <Svg>
      <g data-anim="fade">
        <rect x="30" y="100" width="120" height="100" rx="10" stroke={INK} strokeWidth="1.6" />
        <text x="90" y="155" textAnchor="middle" {...label}>{T.link.left}</text>
      </g>
      <g data-anim="fade" data-at="0.3">
        <rect x="250" y="100" width="120" height="100" rx="10" stroke={AMBER} strokeWidth="1.8" fill="rgb(245 163 92 / 0.06)" />
        <text x="310" y="155" textAnchor="middle" {...label} fill={AMBER}>{T.link.right}</text>
      </g>
      <path d="M150 140 L250 140 M250 160 L150 160" stroke={INK} strokeWidth="1.6" strokeDasharray="5 5" data-anim="draw" data-at="0.8" />
      <g data-anim="pop" data-at="1.6">
        <rect x="186" y="136" width="28" height="24" rx="4" fill="#141a26" stroke={AMBER} strokeWidth="1.6" />
        <path d="M193 136 v-6 a7 7 0 0 1 14 0 v6" stroke={AMBER} strokeWidth="1.6" />
      </g>
      <text x="200" y="232" textAnchor="middle" {...label} fill={DIM} fontSize="10" data-anim="fade" data-at="1.8">{T.link.note}</text>
    </Svg>
  ),
  why: () => (
    <Svg>
      {T.why.map((word, i) => (
        <text key={word} x="200" y={100 + i * 62} textAnchor="middle" fill={i === 2 ? AMBER : INK} fontFamily="Instrument Serif, serif" fontStyle="italic" fontSize="40" data-anim="fade" data-at={i * 0.6}>
          {word}
        </text>
      ))}
    </Svg>
  ),
  building: () => (
    <Svg>
      <rect x="60" y="90" width="280" height="120" rx="12" stroke={DIM} strokeWidth="1.5" data-anim="fade" />
      <text x="84" y="158" {...label} fontSize="16" fill={INK} data-anim="fade" data-at="0.4">
        <tspan fill={AMBER}>$ </tspan>
        {T.building}
      </text>
      <rect x="250" y="144" width="10" height="18" fill={AMBER} data-anim="pop" data-at="0.9" className="story-caret" />
    </Svg>
  ),
};

export function Visual({ kind }: { kind: SceneVisual }) {
  return <>{VISUALS[kind]()}</>;
}
