/**
 * Four thin L-shaped corner marks, like a viewfinder - the browser's quiet nod
 * to the city outside. The top-left one carries the amber accent.
 */
export default function HudCorners({ inset = 10, size = 14, className = '' }: { inset?: number; size?: number; className?: string }) {
  const corners = [
    { top: inset, left: inset, borderWidth: '1px 0 0 1px', accent: true },
    { top: inset, right: inset, borderWidth: '1px 1px 0 0' },
    { bottom: inset, left: inset, borderWidth: '0 0 1px 1px' },
    { bottom: inset, right: inset, borderWidth: '0 1px 1px 0' },
  ];
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 ${className}`}>
      {corners.map(({ accent, ...place }, i) => (
        <span
          key={i}
          className={`absolute border-solid ${accent ? 'border-accent/60' : 'border-white/20'}`}
          style={{ ...place, width: size, height: size }}
        />
      ))}
    </div>
  );
}
