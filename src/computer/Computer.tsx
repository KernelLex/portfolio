import { useCallback, useEffect, useRef, useState } from 'react';
import { timings } from '../config';
import { bootLines } from '../content/desktop';
import type { IntroResult } from '../intro/scenes/StreetScene';
import { playClick, playWhoosh } from '../lib/sound';
import AppWindow from './AppWindow';
import { APPS, appMeta, rectOf, type AppId, type WindowAppId } from './apps';
import BootSequence from './BootSequence';
import BrowserWindow from './BrowserWindow';
import Desktop from './Desktop';
import Taskbar from './Taskbar';
import Wallpaper from './Wallpaper';
import Notepad from './apps/Notepad';
import RecycleBin from './apps/RecycleBin';
import Terminal from './apps/Terminal';

/**
 * fresh: walked in through the cafe. skipped: jumped past the game.
 * returning: has been here before, and gets the browser opened for them.
 */
export type ComputerEntry = 'fresh' | 'skipped' | 'returning';

type Props = {
  entry: ComputerEntry;
  intro?: IntroResult;
  reducedMotion: boolean;
  /** Log off: back out to the street. */
  onLogOff: () => void;
};

type OpenWindow = { id: WindowAppId; z: number; offset: number };
type BrowserState = 'closed' | 'open' | 'minimized';

const WINDOW_WIDTH: Record<WindowAppId, number> = { readme: 440, terminal: 560, trash: 320 };

/**
 * The cafe PC: boot, then a desktop that behaves like one. Its whole job is to
 * be the way into the browser, which the visitor opens themselves.
 */
export default function Computer({ entry, intro, reducedMotion, onLogOff }: Props) {
  const [stage, setStage] = useState<'boot' | 'desktop'>('boot');
  const [windows, setWindows] = useState<OpenWindow[]>([]);
  const [browser, setBrowser] = useState<BrowserState>('closed');
  const [launchFrom, setLaunchFrom] = useState<DOMRect | null>(null);
  const [hint, setHint] = useState(entry !== 'returning');

  const browserRef = useRef<BrowserState>('closed');
  browserRef.current = browser;
  const zTop = useRef(20);

  // Returning visitors get the browser opened for them.
  const quick = entry === 'returning' || reducedMotion;
  // The BIOS beat belongs to the walk-in; anyone who skipped wanted speed.
  const [lines] = useState(() =>
    entry === 'fresh' && !reducedMotion
      ? bootLines(intro && { found: intro.notesFound, total: intro.notesTotal })
      : null,
  );

  const openBrowser = useCallback((from: DOMRect | null) => {
    if (browserRef.current === 'open') return;
    if (browserRef.current === 'closed') setLaunchFrom(from);
    setBrowser('open');
    setHint(false);
    playWhoosh();
  }, []);

  const focusWindow = useCallback((id: WindowAppId) => {
    setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, z: ++zTop.current } : w)));
  }, []);

  const openApp = useCallback(
    (id: AppId, from: DOMRect | null) => {
      if (id === 'navigator') {
        openBrowser(from ?? rectOf('[data-app="navigator"]'));
        return;
      }
      playClick();
      setWindows((ws) =>
        ws.some((w) => w.id === id)
          ? ws.map((w) => (w.id === id ? { ...w, z: ++zTop.current } : w))
          : [...ws, { id, z: ++zTop.current, offset: ws.length }],
      );
    },
    [openBrowser],
  );

  const closeWindow = useCallback((id: WindowAppId) => {
    setWindows((ws) => ws.filter((w) => w.id !== id));
  }, []);

  // A returning visitor has done the walk already: open the browser for them.
  // Everyone else opens it themselves - nothing on this PC moves on its own.
  useEffect(() => {
    if (stage !== 'desktop' || !quick) return;
    const t = window.setTimeout(() => {
      if (browserRef.current === 'closed') openBrowser(rectOf('[data-app="navigator"]'));
    }, timings.returningAutoOpen);
    return () => window.clearTimeout(t);
  }, [stage, quick, openBrowser]);

  const running = [
    ...(browser !== 'closed' ? [{ app: appMeta('navigator'), minimized: browser === 'minimized' }] : []),
    ...windows.map((w) => ({ app: appMeta(w.id), minimized: false })),
  ];

  return (
    <div className="fixed inset-0 overflow-hidden bg-black text-ink">
      <Wallpaper />

      {stage === 'desktop' && (
        <div className="absolute inset-0" style={{ animation: 'fade-in 450ms ease-out both' }}>
          <Desktop apps={APPS} onOpen={openApp} showHint={hint} />

          {windows.map((w) => {
            const meta = appMeta(w.id);
            return (
              <AppWindow
                key={w.id}
                title={meta.label}
                icon={<meta.Icon className="h-4 w-4" />}
                z={w.z}
                offset={w.offset}
                width={WINDOW_WIDTH[w.id]}
                onClose={() => closeWindow(w.id)}
                onFocus={() => focusWindow(w.id)}
              >
                {w.id === 'readme' && <Notepad />}
                {w.id === 'terminal' && <Terminal onOpenBrowser={() => openApp('navigator', null)} />}
                {w.id === 'trash' && <RecycleBin />}
              </AppWindow>
            );
          })}

          <Taskbar
            running={running}
            onActivate={(id) => (id === 'navigator' ? openBrowser(null) : focusWindow(id))}
            onOpen={openApp}
            onLogOff={onLogOff}
          />

          {browser !== 'closed' && (
            <BrowserWindow
              mode={browser}
              launchFrom={launchFrom}
              reducedMotion={reducedMotion}
              onMinimized={() => setBrowser('minimized')}
              onClosed={() => setBrowser('closed')}
              onLogOff={onLogOff}
            />
          )}
        </div>
      )}

      {stage === 'boot' && <BootSequence lines={lines} onDone={() => setStage('desktop')} />}
    </div>
  );
}
