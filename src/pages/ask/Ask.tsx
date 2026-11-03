import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, Bot, Send, Trash2, Volume2, VolumeX } from 'lucide-react';
import { useBrowser } from '../../browser/BrowserContext';
import { ASK, FAQ, FAQ_UNKNOWN } from '../../content/ask';
import { isPageId } from '../../browser/address';
import type { PageId } from '../../content/pages';
import { postJSON } from '../../lib/api';
import { playClick } from '../../lib/sound';
import FallbackMic from '../../voice/FallbackMic';
import { useWisprInput } from '../../voice/useWisprInput';
import VoiceBadge from '../../voice/VoiceBadge';
import WisprHint from '../../voice/WisprHint';
import { pageEntry } from '../registry';

type Message = { id: number; role: 'user' | 'assistant'; text: string; tab?: PageId; offline?: boolean };

// The conversation outlives the tab: switching away and back keeps it.
let saved: Message[] = [];
const answered = new Set<string>();
let nextId = 1;
const HISTORY_SENT = 10;
const VOICE_SEND_MS = 1000;

function faqAnswer(question: string): { text: string; tab?: PageId } {
  const q = ` ${question.toLowerCase()} `;
  let best: { score: number; text: string; tab?: PageId } = { score: 0, text: FAQ_UNKNOWN };
  for (const entry of FAQ) {
    const score = entry.keywords.filter((k) => q.includes(k)).length;
    if (score > best.score) best = { score, text: entry.answer, tab: entry.tab };
  }
  return best;
}

/** Ask Amogh: chat with the AI twin, by voice or keyboard. */
export default function Ask() {
  const { address, open } = useBrowser();
  const [messages, setMessages] = useState<Message[]>(saved);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [speaking, setSpeaking] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const voiceTimer = useRef(0);
  const busyRef = useRef(false);
  const queued = useRef<string | null>(null);

  useEffect(() => {
    saved = messages;
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages]);

  const send = async (raw: string) => {
    const question = raw.trim();
    if (!question) return;
    // One question at a time; one that arrives meanwhile waits its turn.
    if (busyRef.current) {
      queued.current = question;
      return;
    }
    busyRef.current = true;
    window.clearTimeout(voiceTimer.current);
    setDraft('');
    const history = saved.slice(-HISTORY_SENT).map(({ role, text }) => ({ role, content: text }));
    setMessages((m) => [...m, { id: nextId++, role: 'user', text: question }]);
    setBusy(true);
    const result = await postJSON<{ reply: string; suggestedTab?: string | null }>('/api/ask', { message: question, history });
    const reply = result
      ? { text: result.reply, tab: result.suggestedTab && isPageId(result.suggestedTab) ? result.suggestedTab : undefined }
      : faqAnswer(question);
    setMessages((m) => [...m, { id: nextId++, role: 'assistant', text: reply.text, tab: reply.tab, offline: !result }]);
    setBusy(false);
    busyRef.current = false;
    const next = queued.current;
    queued.current = null;
    if (next) void sendRef.current(next);
  };
  const sendRef = useRef(send);
  sendRef.current = send;

  // Questions asked from elsewhere (the address bar, a case study) arrive as ?q=.
  useEffect(() => {
    const q = address.query.get('q');
    if (!q || answered.has(address.raw)) return;
    answered.add(address.raw);
    void sendRef.current(q);
  }, [address]);

  const reading = useWisprInput(inputRef, () => {
    window.clearTimeout(voiceTimer.current);
    voiceTimer.current = window.setTimeout(() => void sendRef.current(inputRef.current?.value ?? ''), VOICE_SEND_MS);
  });

  useEffect(
    () => () => {
      window.clearTimeout(voiceTimer.current);
      window.speechSynthesis?.cancel();
    },
    [],
  );

  const speak = (m: Message) => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    if (speaking === m.id) {
      setSpeaking(null);
      return;
    }
    const line = new SpeechSynthesisUtterance(m.text);
    line.lang = 'en-IN';
    line.onend = () => setSpeaking(null);
    setSpeaking(m.id);
    synth.speak(line);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(draft);
  };

  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col 2xl:max-w-4xl px-4 pt-6 pb-6 sm:px-8 sm:pt-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] tracking-[0.25em] text-accent uppercase">{ASK.eyebrow}</p>
          <h1 className="mt-2 flex items-center gap-3 font-display text-5xl text-ink">
            {ASK.title}
            <span className="rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 font-mono text-[10px] tracking-[0.16em] text-accent uppercase">{ASK.badge}</span>
          </h1>
          <p className="mt-3 flex items-center gap-2 text-sm text-ink-muted">
            <Bot className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.8} />
            {ASK.label}
          </p>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => {
              playClick();
              setMessages([]);
            }}
            className="inline-flex items-center gap-1.5 font-mono text-[11px] text-ink-muted hover:text-accent"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
            {ASK.clear}
          </button>
        )}
      </header>

      <div className="mt-6 flex-1 space-y-4" aria-live="polite">
        <div className="glass max-w-[85%] rounded-2xl rounded-tl-sm px-4 py-3 text-[15px] leading-relaxed text-ink">{ASK.greeting}</div>
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {ASK.starters.map((s) => (
              <button key={s} type="button" onClick={() => void send(s)} className="rounded-full border border-white/[0.12] px-3 py-1.5 text-sm text-ink-muted transition-colors hover:border-accent/50 hover:text-accent">
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m) =>
          m.role === 'user' ? (
            <div key={m.id} className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-accent/[0.12] px-4 py-3 text-[15px] leading-relaxed text-ink">
              <span className="sr-only">{ASK.you}: </span>
              {m.text}
            </div>
          ) : (
            <div key={m.id} className="max-w-[85%]">
              <div className="glass rounded-2xl rounded-tl-sm px-4 py-3 text-[15px] leading-relaxed text-ink">
                <span className="sr-only">{ASK.twin}: </span>
                {m.text}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-3 px-1">
                {m.tab && (
                  <button type="button" onClick={() => open(m.tab!)} className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
                    {ASK.openTab(pageEntry(m.tab).title)}
                    <ArrowRight className="h-3 w-3" strokeWidth={2} />
                  </button>
                )}
                {'speechSynthesis' in window && (
                  <button type="button" onClick={() => speak(m)} aria-label={speaking === m.id ? ASK.stopReading : ASK.readAloud} className="text-ink-muted hover:text-ink">
                    {speaking === m.id ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                  </button>
                )}
                {m.offline && <span className="text-[10.5px] text-ink-muted/80">{ASK.offline}</span>}
              </div>
            </div>
          ),
        )}
        {busy && (
          <div className="glass inline-flex items-center gap-1.5 rounded-2xl rounded-tl-sm px-4 py-3" aria-label={ASK.thinking}>
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-1.5 w-1.5 rounded-full bg-ink-muted" style={{ animation: `fade-in 900ms ${i * 150}ms ease-in-out infinite alternate` }} />
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-0 mt-6 bg-gradient-to-t from-space via-space/95 to-transparent pt-4">
        <form onSubmit={onSubmit} className="relative">
          <VoiceBadge reading={reading} className="absolute -top-9 left-1/2 -translate-x-1/2" />
          <div className="flex h-12 items-center gap-2 rounded-xl border border-white/[0.1] bg-surface pr-1.5 pl-4 focus-within:border-accent/40">
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => {
                window.clearTimeout(voiceTimer.current);
                setDraft(e.target.value);
              }}
              aria-label={ASK.inputLabel}
              placeholder={ASK.placeholder}
              enterKeyHint="send"
              autoComplete="off"
              className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-muted/70 focus-visible:outline-none"
            />
            <button type="submit" disabled={!draft.trim() || busy} aria-label={ASK.send} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent text-space disabled:opacity-30">
              <Send className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </form>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3 px-1">
          <WisprHint />
          <FallbackMic onFinal={(text) => void send(text)} />
        </div>
      </div>
    </div>
  );
}
