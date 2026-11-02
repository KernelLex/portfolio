import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Copy, ExternalLink, Mic, Sparkles, Square, Zap } from 'lucide-react';
import { useBrowser } from '../../browser/BrowserContext';
import { LENS, type LensMode } from '../../content/promptLens';
import { postJSON } from '../../lib/api';
import { playClick } from '../../lib/sound';
import { useLiveSpeech } from '../../voice/useLiveSpeech';
import { useWisprInput } from '../../voice/useWisprInput';
import VoiceBadge from '../../voice/VoiceBadge';
import WisprHint from '../../voice/WisprHint';
import { offlinePrompt } from './offline';

/** Wispr's chunk has landed: give the visitor a beat to add to it, then enhance. */
const AUTO_ENHANCE_MS = 1000;

const PANEL = 'flex min-h-[22rem] flex-col rounded-2xl border border-white/[0.08] bg-surface/60';
const PANEL_HEAD = 'flex items-center gap-2 border-b border-white/[0.06] px-4 py-3 font-mono text-[10.5px] tracking-[0.18em] text-ink-muted uppercase';

/** The engineered prompt, with its section headings picked out. */
function Rendered({ text }: { text: string }) {
  return (
    <div className="space-y-1.5 text-[13.5px] leading-relaxed text-ink/90">
      {text.split('\n').map((line, i) =>
        line.startsWith('## ') ? (
          <p key={i} className="pt-3 font-mono text-[10.5px] tracking-[0.18em] text-accent uppercase first:pt-0">
            {line.slice(3)}
          </p>
        ) : line.startsWith('- ') ? (
          <p key={i} className="flex gap-2 pl-1">
            <span className="text-accent/70">•</span>
            {line.slice(2)}
          </p>
        ) : (
          line && <p key={i}>{line}</p>
        ),
      )}
    </div>
  );
}

/** Prompt Lens: raw speech, Wispr's clean text, and the engineered prompt, side by side. */
export default function PromptLens() {
  const { open } = useBrowser();
  const textRef = useRef<HTMLTextAreaElement>(null);
  const timer = useRef(0);
  const [mode, setMode] = useState<LensMode>('coding');
  const [text, setText] = useState('');
  const [heard, setHeard] = useState('');
  const [prompt, setPrompt] = useState('');
  const [source, setSource] = useState('');
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<'before' | 'after'>('after');
  const [copied, setCopied] = useState(false);
  const speech = useLiveSpeech({ lang: 'en-IN', onFinal: setHeard });

  const enhance = async (input: string, as: LensMode) => {
    const idea = input.trim();
    if (!idea || busy) return;
    window.clearTimeout(timer.current);
    setBusy(true);
    const result = await postJSON<{ prompt: string }>('/api/prompt-lens', { text: idea, mode: as });
    setPrompt(result?.prompt ?? offlinePrompt(idea, as));
    setOffline(!result);
    setSource(idea);
    setView('after');
    setBusy(false);
  };
  const enhanceRef = useRef(enhance);
  enhanceRef.current = enhance;

  const reading = useWisprInput(textRef, () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void enhanceRef.current(textRef.current?.value ?? '', mode), AUTO_ENHANCE_MS);
  });
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked: the text is still selectable */
    }
  };
  const live = speech.listening ? speech.interim : heard;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-16 sm:px-8 sm:pt-8">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-xl">
          <p className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">{LENS.eyebrow}</p>
          <h1 className="mt-2 font-display text-5xl text-ink sm:text-6xl">{LENS.title}</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">{LENS.lead}</p>
        </div>
        <ol className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-ink-muted">
          {LENS.pipeline.map((step, i) => (
            <li key={step} className="flex items-center gap-2">
              <span className={`rounded-full border px-2.5 py-1 ${i === 2 ? 'border-accent/50 text-accent' : 'border-white/[0.12]'}`}>{step}</span>
              {i < 2 && <ArrowRight className="h-3 w-3" strokeWidth={2} />}
            </li>
          ))}
        </ol>
      </header>

      <div className="mt-6 flex flex-wrap items-center gap-2" role="radiogroup" aria-label={LENS.modesLabel}>
        {LENS.modes.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={mode === m.id}
            onClick={() => setMode(m.id)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              mode === m.id ? 'border-accent/60 bg-accent/10 text-accent' : 'border-white/[0.1] text-ink-muted hover:text-ink'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className={PANEL} aria-label={LENS.raw.title}>
          <h2 className={PANEL_HEAD}>
            <Mic className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
            {LENS.raw.title}
          </h2>
          <div className="flex flex-1 flex-col gap-3 p-4">
            {speech.supported ? (
              <>
                <button
                  type="button"
                  aria-pressed={speech.listening}
                  onClick={() => {
                    playClick();
                    if (speech.listening) speech.stop();
                    else speech.start();
                  }}
                  className={`flex h-9 w-max items-center gap-2 rounded-lg border px-3 text-sm ${
                    speech.listening ? 'border-accent/60 bg-accent/10 text-accent' : 'border-white/[0.12] text-ink hover:border-white/25'
                  }`}
                >
                  {speech.listening ? <Square className="h-3.5 w-3.5" strokeWidth={2} /> : <Mic className="h-4 w-4" strokeWidth={1.8} />}
                  {speech.listening ? LENS.raw.stop : LENS.raw.start}
                </button>
                <p aria-live="polite" className={`min-h-28 flex-1 font-mono text-sm leading-relaxed ${live ? 'text-ink/85' : 'text-ink-muted/70'}`}>
                  {live || LENS.raw.empty}
                  {speech.listening && <span className="story-caret ml-0.5 inline-block h-4 w-2 translate-y-0.5 bg-accent" />}
                </p>
                {heard && !speech.listening && (
                  <button type="button" onClick={() => setText(heard)} className="w-max text-xs text-accent hover:underline">
                    {LENS.raw.use}
                  </button>
                )}
                {speech.error && <p className="text-xs text-accent">{speech.error}</p>}
              </>
            ) : (
              <p className="text-sm text-ink-muted">{LENS.raw.unsupported}</p>
            )}
            <p className="text-[10.5px] leading-snug text-ink-muted/80">{LENS.raw.note}</p>
          </div>
        </section>

        <section className={PANEL} aria-label={LENS.clean.title}>
          <h2 className={PANEL_HEAD}>
            <Zap className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
            {LENS.clean.title}
          </h2>
          <div className="relative flex flex-1 flex-col gap-3 p-4">
            <VoiceBadge reading={reading} className="absolute -top-3 right-4" />
            <textarea
              ref={textRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              aria-label={LENS.clean.label}
              placeholder={LENS.clean.placeholder}
              className="min-h-40 flex-1 resize-none rounded-xl border border-white/[0.08] bg-space/60 p-3 text-sm leading-relaxed text-ink outline-none placeholder:text-ink-muted/60 focus:border-accent/40 focus-visible:outline-none"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <WisprHint />
              <button
                type="button"
                disabled={!text.trim() || busy}
                onClick={() => void enhance(text, mode)}
                className="flex h-9 items-center gap-2 rounded-lg bg-accent px-3.5 text-sm font-medium text-space transition-opacity disabled:opacity-30"
              >
                <Sparkles className="h-4 w-4" strokeWidth={1.8} />
                {busy ? LENS.working : LENS.enhance}
              </button>
            </div>
          </div>
        </section>

        <section className={PANEL} aria-label={LENS.output.title} aria-busy={busy}>
          <h2 className={`${PANEL_HEAD} justify-between`}>
            <span className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
              {LENS.output.title}
            </span>
            {prompt && (
              <span className="flex rounded-md border border-white/[0.1] p-0.5 normal-case">
                {(['before', 'after'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={view === v}
                    onClick={() => setView(v)}
                    className={`rounded px-2 py-0.5 tracking-normal ${view === v ? 'bg-white/10 text-ink' : 'text-ink-muted'}`}
                  >
                    {LENS.output[v]}
                  </button>
                ))}
              </span>
            )}
          </h2>
          <div className="flex flex-1 flex-col gap-3 p-4">
            <div className="max-h-[26rem] min-h-40 flex-1 overflow-y-auto">
              {!prompt ? (
                <p className="text-sm text-ink-muted/70">{LENS.output.empty}</p>
              ) : view === 'after' ? (
                <Rendered text={prompt} />
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-ink-muted">{source}</p>
              )}
            </div>
            {offline && prompt && <p className="text-[11px] leading-snug text-accent/90">{LENS.offline}</p>}
            {prompt && (
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void copy()} className="flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.12] px-3 text-xs text-ink hover:border-accent/50">
                  {copied ? <Check className="h-3.5 w-3.5 text-accent" strokeWidth={2} /> : <Copy className="h-3.5 w-3.5" strokeWidth={1.8} />}
                  {copied ? LENS.output.copied : LENS.output.copy}
                </button>
                {[
                  [LENS.output.chatgpt, `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`],
                  [LENS.output.claude, `https://claude.ai/new?q=${encodeURIComponent(prompt)}`],
                ].map(([label, href]) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.12] px-3 text-xs text-ink hover:border-accent/50">
                    {label}
                    <ExternalLink className="h-3 w-3" strokeWidth={2} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <footer className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/[0.06] pt-5 text-sm text-ink-muted">
        <span>{LENS.footer}</span>
        <button type="button" onClick={() => open('receipts')} className="inline-flex items-center gap-1 text-accent hover:underline">
          {LENS.receipts}
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </footer>
    </div>
  );
}
