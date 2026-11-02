import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Mic } from 'lucide-react';
import { TITLE } from '../content/title';
import { cleanName, playerName, setPlayerName } from '../lib/player';
import { playPickup } from '../lib/sound';
import { useWisprInput } from '../voice/useWisprInput';
import VoiceBadge from '../voice/VoiceBadge';

type Props = {
  /** ↑ ↓ and Enter still drive the menu while the field has focus. */
  onMove: (delta: -1 | 1) => void;
  onEnter: () => void;
  /** Ready to listen as soon as it appears (not on phones, where it would pop the keyboard). */
  autoFocus: boolean;
  moving: boolean;
};

/** Letters landing together drop in one after another. */
const STAGGER_MS = 55;

/**
 * Arcade name entry, by voice: hold the Wispr key and say your name. Wispr
 * types it in one go, the detector spots it, and the letters drop in as pixel
 * type. Typing works too, a letter at a time.
 */
export default function NameEntry({ onMove, onEnter, autoFocus, moving }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(playerName);
  // How many letters were already there before the latest change.
  const [landed, setLanded] = useState(0);
  const name = cleanName(value).toUpperCase();
  const reading = useWisprInput(inputRef, playPickup);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  return (
    <div className="max-w-xl">
      <label htmlFor="player-name" className="font-pixel text-[10px] tracking-[0.3em] text-ink-muted">
        {TITLE.player.label}
      </label>
      <div className="relative mt-2">
        <div className="flex h-11 items-center gap-2.5 border-2 border-white/60 bg-black/55 px-3 transition-colors focus-within:border-accent">
          <Mic className="h-4 w-4 shrink-0 text-accent" strokeWidth={2} aria-hidden="true" />
          <input
            id="player-name"
            ref={inputRef}
            value={value}
            onChange={(e) => {
              setLanded(name.length);
              setValue(e.target.value);
              setPlayerName(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onEnter();
              } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault();
                onMove(e.key === 'ArrowUp' ? -1 : 1);
              }
            }}
            maxLength={40}
            placeholder={TITLE.player.placeholder}
            aria-label={TITLE.player.inputLabel}
            autoComplete="off"
            spellCheck={false}
            className="h-full min-w-0 flex-1 bg-transparent font-pixel text-[12px] tracking-widest text-white uppercase outline-none placeholder:text-ink-muted/60"
          />
        </div>
        <VoiceBadge reading={reading} className="absolute -top-9 right-0" />
      </div>
      <p className="mt-2 font-sign text-[11px] text-ink-muted">{TITLE.player.hint}</p>
      {name && (
        <p aria-live="polite" className="mt-3 font-pixel text-[clamp(16px,2.2vw,28px)] leading-none text-accent">
          <span className="mr-3 text-white">{TITLE.player.hello}</span>
          {[...name].map((ch, i) => (
            <span key={i} className={`inline-block ${moving ? 'title-name-letter' : ''}`} style={{ '--delay': `${Math.max(0, i - landed) * STAGGER_MS}ms` } as CSSProperties}>
              {ch === ' ' ? ' ' : ch}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
