/**
 * Original icon set for the cafe PC. Nothing traced from any real OS.
 * Each takes a className so the caller decides the size.
 */
type IconProps = { className?: string };

/** The browser: a compass needle inside an orbit, in the shared amber. */
export function NavigatorIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="nav-tile" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1c2433" />
          <stop offset="1" stopColor="#0b0e17" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="42" height="42" rx="11" fill="url(#nav-tile)" stroke="#f5a35c" strokeOpacity="0.35" />
      <circle cx="24" cy="24" r="12.5" fill="none" stroke="#f5a35c" strokeOpacity="0.55" strokeWidth="1.4" />
      <path d="M24 10.5 L28 24 L24 37.5 L20 24 Z" fill="#e9ebf2" fillOpacity="0.85" />
      <path d="M24 10.5 L28 24 L20 24 Z" fill="#f5a35c" />
      <circle cx="24" cy="24" r="1.8" fill="#0b0e17" />
      <circle cx="35" cy="13" r="1.3" fill="#f5a35c" />
    </svg>
  );
}

export function NotepadIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path d="M12 5h17l9 9v29H12z" fill="#dfe5f2" />
      <path d="M29 5v9h9" fill="#b3bdd6" />
      <path d="M17 21h16M17 27h16M17 33h11" stroke="#6a7593" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function TerminalIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect x="4" y="8" width="40" height="32" rx="6" fill="#05060d" stroke="#8b93a7" strokeOpacity="0.4" />
      <path d="M12 19l6 5-6 5" fill="none" stroke="#b6f34b" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 30h12" stroke="#e9ebf2" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function TrashIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path d="M13 15h22l-2.4 26H15.4z" fill="#8c97b3" fillOpacity="0.35" stroke="#b3bdd6" strokeWidth="1.6" />
      <path d="M10 15h28M19 15v-4h10v4" fill="none" stroke="#b3bdd6" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M20 21v14M24 21v14M28 21v14" stroke="#b3bdd6" strokeOpacity="0.6" strokeWidth="1.4" />
    </svg>
  );
}

/** The OS mark: a hexagon around a kernel dot. */
export function OsLogo({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path d="M24 5l16.5 9.5v19L24 43 7.5 33.5v-19z" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M24 15l8 4.6v9.2L24 33.4l-8-4.6v-9.2z" fill="currentColor" fillOpacity="0.25" />
      <circle cx="24" cy="24" r="3.2" fill="#f5a35c" />
    </svg>
  );
}

export function WifiIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
      <path d="M2 6.5a9 9 0 0112 0M4.3 9a5.5 5.5 0 017.4 0M6.6 11.4a2 2 0 012.8 0" />
      <circle cx="8" cy="13.4" r="0.6" fill="currentColor" />
    </svg>
  );
}
