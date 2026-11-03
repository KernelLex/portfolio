/**
 * Amogh as a 2D game character, drawn from his photo: the long wavy hair, the
 * moustache, the black shirt and the gold chain. One character per pixel; '.'
 * is empty. He breathes (the head dips a pixel) and blinks (index.css).
 */
const ART = [
  '................................',
  '..........KKkKKKKKKKKK..........',
  '........KKKKKkKKKKKkKKKK........',
  '.......KKkKKKKKKKKKKKkKKK.......',
  '......KKKKkKKKKKKKKKKKkKKK......',
  '.....KKKKKKKKKKKKKKKKKKKKKK.....',
  '.....KKkKKKKKKKKKKKKKKKKkKK.....',
  '....KKKKkKKKKKKKKKKKKKKKKkKK....',
  '....KKKKKKKKKSSSSKKKKKKKKKKK....',
  '....KkKKKKKKSSSSSSSKKKKKKKkK....',
  '...KKKkKKKSSSSSSSSSSSSKKKKKKK...',
  '...KKKKKKSSSSSSSSSSSSSSKKKKkK...',
  '...KkKKKKSSBBBSSSSBBBSSKKKKKK...',
  '...KKkKKKSSSSSSSSSSSSSSKKKKKK...',
  '...KKKKKKSSwESSSSSSwESSKKKKkK...',
  '...KKKKKKSSEESSSSSSEESSKKKkKK...',
  '...kKKKKKSSssSSssSSssSSKKKKKK...',
  '..KKkKKKKShSSSssssSSSSSKKKKKKK..',
  '..KKKKKKKSSSSSSSSSSSSSSKKKKKkK..',
  '..KKKKKKKSSMMMMMMMMMMSSKKKKkKK..',
  '..KkKKKKKSMSSSSmmSSSSMSKKKKKKK..',
  '..KKkKKKKKSSSSSSSSSSSsKKKKKKKK..',
  '..KKKKKKKKKSSSSSSSSSsKKKKKKkKK..',
  '...KKKKKKKKKKSSSSSSKKKKKKKkKK...',
  '...KKkKKKKKKKsSSSSsKKKKKKKKKK...',
  '..CKKKkKKKKKCcGSSGcCKKKKKKKKKC..',
  '.CCKKKKKKKKCCCcGGcCCCKKKKkKKKCC.',
  '.CCCKKkKKKCCCCCccCCCCCKKkKKKCCC.',
  'CCCCCKKKKCCCCCCCCCCCCCCKKKKCCCCC',
  'CCCCCcCCCCCCCCCCCCCCCCCCCCcCCCCC',
  'CCCCCCcCCCCCCCCCCCCCCCCCCcCCCCCC',
  'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
];

const COLOURS: Record<string, string> = {
  K: '#17121c',
  k: '#3e324c',
  S: '#9b6644',
  s: '#7a4c31',
  h: '#b67d56',
  B: '#1d1416',
  E: '#120c0e',
  w: '#ece2d6',
  M: '#1e1517',
  m: '#6e3a2d',
  C: '#18191f',
  c: '#2e303a',
  G: '#e7b65c',
};

/** Rows from here down are the shoulders, which stay put while the head breathes. */
const SHOULDERS = 25;
const EYES = new Set(['E', 'w']);

/** One rect per run of a colour along a row, rather than one per pixel. */
function runs(y: number, pick: (px: string) => string | null) {
  const row = ART[y];
  const out = [];
  for (let x = 0; x < row.length; ) {
    const colour = pick(row[x]);
    let end = x + 1;
    while (end < row.length && pick(row[end]) === colour) end++;
    if (colour) out.push(<rect key={`${x}-${y}`} x={x} y={y} width={end - x} height="1" fill={COLOURS[colour]} />);
    x = end;
  }
  return out;
}

const rows = (from: number, to: number, pick: (px: string) => string | null) => Array.from({ length: to - from }, (_, i) => runs(from + i, pick));

// Under the eyes, skin: what shows when they close.
const skinUnderEyes = (px: string) => (px === '.' ? null : EYES.has(px) ? 'S' : px);
const eyesOnly = (px: string) => (EYES.has(px) ? px : null);
// Closed, an eye is the dark line of its lower half.
const lids = [11, 12, 19, 20];

export default function AvatarSprite({ className = '', label }: { className?: string; label: string }) {
  return (
    <svg viewBox={`0 0 ${ART[0].length} ${ART.length}`} className={className} shapeRendering="crispEdges" role="img" aria-label={label}>
      <g>{rows(SHOULDERS, ART.length, skinUnderEyes)}</g>
      <g className="avatar-head">
        {rows(0, SHOULDERS, skinUnderEyes)}
        <g className="avatar-eyes">{rows(14, 16, eyesOnly)}</g>
        <g className="avatar-lids">
          {lids.map((x) => (
            <rect key={x} x={x} y={15} width="1" height="1" fill={COLOURS.E} />
          ))}
        </g>
      </g>
    </svg>
  );
}
