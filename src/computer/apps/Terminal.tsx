import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Download, ExternalLink, ListChecks } from 'lucide-react';
import { addressUrl } from '../../browser/address';
import { NEOFETCH, TERMINAL } from '../../content/desktop';
import { PROFILES, RESUME } from '../../content/links';
import { downloadResume } from '../../lib/resume';
import { playClick } from '../../lib/sound';
import { answer } from '../../tour/answer';
import { guide } from '../../tour/guide';

type Props = {
  /** Called for "open" / "open navigator" / anything asking for the browser. */
  onOpenBrowser: () => void;
};

/** `cells` lays a line out as two columns, so a list lines up in any font. */
type Line = { text: string; kind: 'out' | 'in' | 'err' | 'accent'; cells?: [string, string] };

/** "resume      download my résumé" as a command and what it does. */
const row = (text: string): Line => {
  const m = /^(\S+)\s{2,}(.*)$/.exec(text);
  return m ? { text, kind: 'out', cells: [m[1], m[2]] } : { text, kind: 'out' };
};

const session = () => {
  const s = Math.floor(performance.now() / 1000);
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;
};

const TOOL = 'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-[11px] transition-colors';

/**
 * A tiny shell. Voice-first like every input on the site: Wispr types its
 * whole phrase in one go, so natural phrasing ("download my resume", "open
 * the story") is matched on keywords rather than demanding an exact command.
 * The toolbar puts the two things most people want one click away.
 */
export default function Terminal({ onOpenBrowser }: Props) {
  const [lines, setLines] = useState<Line[]>(() => [
    ...TERMINAL.banner.map((text): Line => ({ text, kind: 'accent' })),
    { text: '', kind: 'out' },
    ...TERMINAL.welcome.map((text): Line => ({ text, kind: 'out' })),
  ]);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [lines]);

  const run = (raw: string): Line[] => {
    const input = raw.trim();
    const cmd = input.toLowerCase().replace(/[.!?]+$/, '');
    const word = cmd.split(/\s+/)[0] ?? '';
    const rest = cmd.slice(word.length).trim();
    const out = (text: string): Line => ({ text, kind: 'out' });

    if (!cmd) return [];
    if (/\b(resume|résumé|cv)\b/.test(cmd)) {
      downloadResume();
      return [out(TERMINAL.downloading(RESUME.file))];
    }
    if (TERMINAL.helpWords.includes(word) || TERMINAL.helpWords.includes(cmd)) return TERMINAL.help.map(row);
    // "open story", "open the client work": go straight to that page.
    if (word === 'open' && rest && !/^(the )?(navigator|browser)$/.test(rest)) {
      const reply = answer(rest, 'desktop', false).action;
      if (reply.kind === 'go' && !reply.to.startsWith('ask?')) {
        guide.go(reply.to);
        window.setTimeout(onOpenBrowser, 350);
        return [out(TERMINAL.goingTo(addressUrl(reply.to)))];
      }
    }
    if (word === 'open' || /\b(navigator|browser)\b/.test(cmd)) {
      window.setTimeout(onOpenBrowser, 350);
      return [out(TERMINAL.opening)];
    }
    switch (word) {
      case 'whoami':
        return TERMINAL.whoami.map(out);
      case 'campus':
        return TERMINAL.campus.map(out);
      case 'contact':
        return TERMINAL.contact(PROFILES.linkedin.href, PROFILES.github.href).map(out);
      case 'neofetch': {
        const rows = NEOFETCH.rows(session(), `${window.screen.width}x${window.screen.height}`);
        const pad = ' '.repeat(NEOFETCH.logo[0].length);
        return Array.from({ length: Math.max(NEOFETCH.logo.length, rows.length) }, (_, i): Line => {
          const row = rows[i];
          return { text: `${NEOFETCH.logo[i] ?? pad}${row ? `${row[0].padEnd(10)}${row[1]}` : ''}`, kind: i < NEOFETCH.logo.length ? 'accent' : 'out' };
        });
      }
      case 'ls': {
        const cols = TERMINAL.projectColumns;
        const width = Math.max(...TERMINAL.projects.map((p) => p.length)) + 2;
        const rows: Line[] = [];
        for (let i = 0; i < TERMINAL.projects.length; i += cols) {
          rows.push(out(TERMINAL.projects.slice(i, i + cols).map((p) => p.padEnd(width)).join('')));
        }
        return rows;
      }
      case 'languages':
      case 'lang':
        return [out(TERMINAL.languages)];
      case 'date':
        return [out(new Date().toString())];
      case 'sudo':
        return [out(TERMINAL.sudo)];
      default:
        return [{ text: TERMINAL.notFound(word), kind: 'err' }];
    }
  };

  const enter = (input: string) => {
    if (input.trim().toLowerCase() === 'clear') {
      setLines([]);
      return;
    }
    // Run once, outside the state update: commands download, navigate and open windows.
    const output = run(input);
    setLines((prev) => [...prev, { text: `${TERMINAL.prompt} ${input}`, kind: 'in' }, ...output]);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const input = value;
    setValue('');
    enter(input);
  };

  // The toolbar types its command, as if it had been entered.
  const tool = (command: string) => () => {
    playClick();
    enter(command);
    inputRef.current?.focus();
  };

  return (
    <div className="relative flex h-[min(60vh,24rem)] flex-col bg-black/70" onClick={() => inputRef.current?.focus()}>
      <div aria-hidden="true" className="lyric-scan pointer-events-none absolute inset-0 opacity-70" />
      <div className="relative flex flex-wrap gap-2 border-b border-white/[0.08] px-3 py-2">
        <button type="button" onClick={tool('resume')} className={`${TOOL} border-accent/50 bg-accent/10 text-accent hover:bg-accent/20`}>
          <Download className="h-3.5 w-3.5" strokeWidth={2} />
          {TERMINAL.toolbar.resume}
          <span className="text-accent/60">{RESUME.format}</span>
        </button>
        <button type="button" onClick={tool('help')} className={`${TOOL} border-white/[0.14] text-ink hover:border-accent/50 hover:text-accent`}>
          <ListChecks className="h-3.5 w-3.5" strokeWidth={2} />
          {TERMINAL.toolbar.help}
        </button>
        <button type="button" onClick={tool('open')} className={`${TOOL} border-white/[0.14] text-ink hover:border-accent/50 hover:text-accent`}>
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
          {TERMINAL.toolbar.open}
        </button>
      </div>
      <div className="relative flex-1 overflow-auto px-4 py-3 font-mono text-[12.5px] leading-5">
        {lines.map((line, i) => (
          <div
            key={i}
            style={{ whiteSpace: 'pre-wrap' }}
            className={
              line.kind === 'err'
                ? 'text-[#ff5fa2]'
                : line.kind === 'in'
                  ? 'text-ink'
                  : line.kind === 'accent'
                    ? 'text-accent [text-shadow:0_0_8px_rgb(245_163_92/0.45)]'
                    : 'text-[#b6f34b]/90 [text-shadow:0_0_6px_rgb(182_243_75/0.3)]'
            }
          >
            {line.cells ? (
              <span className="grid grid-cols-[6.5rem_1fr] gap-3">
                <span className="text-accent">{line.cells[0]}</span>
                <span>{line.cells[1]}</span>
              </span>
            ) : (
              line.text || ' '
            )}
          </div>
        ))}
        <form onSubmit={submit} className="flex gap-2 text-ink">
          <label htmlFor="terminal-input" className="shrink-0 text-[#b6f34b]">
            {TERMINAL.prompt}
          </label>
          <input
            id="terminal-input"
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent caret-[#b6f34b] outline-none"
          />
        </form>
        <div ref={endRef} />
      </div>
      <p className="border-t border-white/[0.08] px-4 py-2 text-[11px] text-ink-muted">
        <span aria-hidden="true">🎙️ </span>
        {TERMINAL.voiceHint}
      </p>
    </div>
  );
}
