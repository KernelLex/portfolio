import { useRef, useState, type ReactNode } from 'react';

type Props = {
  title: string;
  icon: ReactNode;
  z: number;
  /** Cascade index, so windows opened in a row do not stack exactly. */
  offset: number;
  width: number;
  onClose: () => void;
  onFocus: () => void;
  children: ReactNode;
};

const TASKBAR_H = 48;

/** A frosted window that can be dragged by its title bar and closed with Esc. */
export default function AppWindow({ title, icon, z, offset, width, onClose, onFocus, children }: Props) {
  const [pos, setPos] = useState(() => {
    const vw = window.innerWidth;
    const w = Math.min(width, vw - 16);
    return {
      x: Math.max(8, Math.min(vw - w - 8, Math.round(vw * 0.22) + offset * 28)),
      y: Math.max(8, Math.round(window.innerHeight * 0.12) + offset * 28),
    };
  });
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const maxX = window.innerWidth - 80;
    const maxY = window.innerHeight - TASKBAR_H - 32;
    setPos({
      x: Math.min(maxX, Math.max(-Math.min(width, window.innerWidth) + 80, e.clientX - drag.current.dx)),
      y: Math.min(maxY, Math.max(0, e.clientY - drag.current.dy)),
    });
  };
  const endDrag = () => {
    drag.current = null;
  };

  return (
    <section
      role="dialog"
      aria-label={title}
      className="glass absolute flex flex-col overflow-hidden rounded-xl shadow-[0_24px_60px_rgba(0,0,0,0.5)]"
      style={{
        left: pos.x,
        top: pos.y,
        zIndex: z,
        width: `min(${width}px, calc(100vw - 16px))`,
        animation: 'window-in 180ms ease-out both',
      }}
      onPointerDown={onFocus}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div
        className="flex cursor-grab touch-none items-center gap-2 border-b border-white/[0.08] px-3 py-2 select-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <span className="h-4 w-4 shrink-0">{icon}</span>
        <h2 className="min-w-0 flex-1 truncate text-xs text-ink-muted">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={`Close ${title}`}
          className="grid h-6 w-6 place-items-center rounded-md text-ink-muted transition-colors hover:bg-white/10 hover:text-ink"
        >
          <svg viewBox="0 0 12 12" className="h-3 w-3" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M2 2l8 8M10 2l-8 8" />
          </svg>
        </button>
      </div>
      {children}
    </section>
  );
}
