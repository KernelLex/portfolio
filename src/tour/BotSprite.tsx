/**
 * Byte, the guide: a small hovering pixel bot, drawn here so it needs no
 * asset. One character per pixel; '.' is empty. The antenna, the core, the
 * eyes, the mouth and the thrusters each animate on their own (index.css).
 */
const ART = [
  '......a......',
  '......s......',
  '..bbbbbbbbb..',
  '.bhhhhhhhhhb.',
  '.bhvvvvvvvhb.',
  '.bhvevvvevhb.',
  '.bhvvmmmvvhb.',
  '.bhhhhhhhhhb.',
  '..bbbbbbbbb..',
  '...bhhhhhb...',
  '..bbhhchhbb..',
  '...bhhhhhb...',
  '....bb.bb....',
  '....gg.gg....',
];

const COLOURS: Record<string, string> = {
  a: '#f5a35c',
  s: '#8b93a7',
  b: '#3a4560',
  h: '#c9d2e6',
  v: '#0b0e17',
  e: '#f5a35c',
  m: '#f5a35c',
  c: '#54e8e0',
  g: 'rgb(245 163 92 / 0.6)',
};

/** Pixels that move together, each as its own group. */
const PARTS: Record<string, string> = { a: 'bot-antenna', c: 'bot-core', e: 'bot-eyes', m: 'bot-mouth', g: 'bot-flames' };

const pixels = (match: (px: string) => boolean) =>
  ART.flatMap((row, y) => [...row].map((px, x) => (px !== '.' && match(px) ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={COLOURS[px]} /> : null)));

export default function BotSprite({ className = '', talking = false }: { className?: string; talking?: boolean }) {
  return (
    <svg viewBox={`0 0 ${ART[0].length} ${ART.length}`} className={`${className} ${talking ? 'bot-talking' : ''}`} shapeRendering="crispEdges" aria-hidden="true">
      {pixels((px) => !(px in PARTS))}
      {Object.entries(PARTS).map(([px, part]) => (
        <g key={px} className={part}>
          {pixels((p) => p === px)}
        </g>
      ))}
    </svg>
  );
}
