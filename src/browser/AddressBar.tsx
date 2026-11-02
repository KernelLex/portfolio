import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, CornerDownLeft, Mic, RotateCw, Zap } from 'lucide-react';
import { ADDRESS, CHROME } from '../content/browser';
import { pageEntry } from '../pages/registry';
import { URL_SCHEME } from '../config';
import { useWisprInput } from '../voice/useWisprInput';
import { addressPath, type Address } from './address';
import ChromeButton from './ChromeButton';
import { resolveCommand } from './resolveCommand';

type Props = {
  address: Address;
  canBack: boolean;
  canForward: boolean;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  /** Go somewhere in the current tab. */
  onGo: (to: string) => void;
};

/** Wispr does not press Enter. A voice chunk goes on its own after this pause. */
const VOICE_GO_MS = 900;

/**
 * Back, forward, reload, and the voice address bar: say or type "open client
 * work" and it goes there; anything it does not recognise becomes a question
 * for Ask Amogh.
 */
export default function AddressBar({ address, canBack, canForward, onBack, onForward, onReload, onGo }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [voice, setVoice] = useState(false);
  const voiceGo = useRef(0);
  const selectOnClick = useRef(false);

  const path = addressPath(address.raw);
  const typed = draft !== null && draft.trim() !== '' && draft !== path;
  const target = typed ? resolveCommand(draft) : null;

  const reset = () => {
    window.clearTimeout(voiceGo.current);
    setDraft(null);
    setVoice(false);
  };

  const go = (text: string) => {
    const to = resolveCommand(text)?.to;
    reset();
    inputRef.current?.blur();
    if (to) onGo(to);
  };
  const goRef = useRef(go);
  goRef.current = go;

  useWisprInput(inputRef, () => {
    setVoice(true);
    window.clearTimeout(voiceGo.current);
    voiceGo.current = window.setTimeout(() => goRef.current(inputRef.current?.value ?? ''), VOICE_GO_MS);
  });
  useEffect(() => () => window.clearTimeout(voiceGo.current), []);

  const destination = target && (target.page === 'ask' && target.to !== 'ask' ? null : pageEntry(target.page));

  return (
    <div className="flex h-11 items-center gap-1 px-2">
      <ChromeButton label={CHROME.back} onClick={onBack} disabled={!canBack}>
        <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
      </ChromeButton>
      <ChromeButton label={CHROME.forward} onClick={onForward} disabled={!canForward}>
        <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
      </ChromeButton>
      <ChromeButton label={CHROME.reload} onClick={onReload} className="hidden sm:grid">
        <RotateCw className="h-3.5 w-3.5" strokeWidth={1.8} />
      </ChromeButton>

      <div data-guide="address-bar" className="relative ml-1 min-w-0 flex-1">
        <input
          ref={inputRef}
          type="text"
          enterKeyHint="go"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-label={ADDRESS.label}
          aria-describedby="address-hint"
          placeholder={ADDRESS.placeholder}
          value={draft ?? path}
          onChange={(e) => {
            window.clearTimeout(voiceGo.current);
            setVoice(false);
            setDraft(e.target.value);
          }}
          onFocus={(e) => {
            setDraft(path);
            e.currentTarget.select();
            selectOnClick.current = true;
          }}
          // Like any browser: the first click selects the whole address, ready to replace.
          onMouseUp={(e) => {
            if (selectOnClick.current) e.preventDefault();
            selectOnClick.current = false;
          }}
          onBlur={reset}
          onKeyDown={(e) => {
            if (e.key === 'Enter') go(draft ?? path);
            if (e.key === 'Escape') {
              reset();
              e.currentTarget.blur();
            }
          }}
          className="h-8 w-full rounded-lg bg-white/[0.04] pr-9 pl-[5.1rem] font-mono text-[12.5px] text-ink ring-1 ring-white/[0.06] transition-colors outline-none placeholder:text-ink-muted/70 hover:bg-white/[0.06] focus:bg-white/[0.07] focus:ring-accent/40 focus-visible:outline-none"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1.5 -translate-y-1/2 rounded-md border border-accent/25 bg-accent/[0.08] px-1.5 py-0.5 font-mono text-[11px] leading-none text-accent"
        >
          {URL_SCHEME}://
        </span>
        <span title={ADDRESS.wispr} className="absolute top-1/2 right-2.5 -translate-y-1/2 text-ink-muted" aria-hidden="true">
          <Mic className="h-3.5 w-3.5" strokeWidth={1.7} />
        </span>

        {draft !== null && (
          <div className="absolute inset-x-0 top-full z-30 mt-1.5 overflow-hidden rounded-xl border border-white/[0.08] bg-surface shadow-[0_18px_50px_rgba(0,0,0,0.5)]">
            {voice && (
              <p className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2 text-xs text-accent">
                <Zap className="h-3.5 w-3.5" strokeWidth={1.8} />
                {ADDRESS.voice}
                <span className="hidden text-ink-muted sm:inline">· {ADDRESS.voiceNote}</span>
              </p>
            )}
            {target ? (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(draft)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-ink transition-colors hover:bg-white/[0.06]"
              >
                {destination ? (
                  <>
                    <destination.icon className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.7} />
                    <span className="min-w-0 flex-1 truncate">{ADDRESS.go(destination.title)}</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.7} />
                    <span className="min-w-0 flex-1 truncate">
                      {ADDRESS.ask}: “{decodeURIComponent(target.to.slice('ask?q='.length))}”
                    </span>
                  </>
                )}
                {destination && (
                  <span className="hidden shrink-0 font-mono text-[11px] text-ink-muted sm:inline">{destination.url}</span>
                )}
                <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-ink-muted" strokeWidth={1.7} />
              </button>
            ) : (
              <p id="address-hint" className="flex items-start gap-2.5 px-3 py-2.5 text-xs leading-relaxed text-ink-muted">
                <Mic className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" strokeWidth={1.7} />
                {ADDRESS.hint}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
