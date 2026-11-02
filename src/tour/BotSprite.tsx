/**
 * Byte, the guide: a small hovering pixel bot, drawn here so it needs no
 * asset. One character per pixel; '.' is empty.
 */
const ART = [
  '......a......',
  '......s......',
  '..bbbbbbbbb..',
  '.bhhhhhhhhhb.',
  '.bhvvvvvvvhb.',
  '.bhvevvvevhb.',
  '.bhvvvvvvvhb.',
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
  c: '#54e8e0',
  g: 'rgb(245 163 92 / 0.45)',
};

export default function BotSprite({ className = '' }: { className?: string }) {
  return (
    <svg viewBox={`0 0 ${ART[0].length} ${ART.length}`} className={className} shapeRendering="crispEdges" aria-hidden="true">
      {ART.flatMap((row, y) =>
        [...row].map((px, x) =>
          px === '.' ? null : (
            <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={COLOURS[px]} className={px === 'e' ? 'bot-eye' : undefined} />
          ),
        ),
      )}
    </svg>
  );
}
