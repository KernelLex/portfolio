import { useCallback, useEffect, useMemo, useRef } from 'react';
import { playClick, playSwoosh } from '../lib/sound';
import { TOUR } from '../content/guide';
import { useReducedMotion } from '../lib/useReducedMotion';
import { guide, useGuide } from '../tour/guide';
import { parseAddress, type Address } from './address';
import AddressBar from './AddressBar';
import { BrowserContext, type BrowserApi } from './BrowserContext';
import LiveWallpaper from './LiveWallpaper';
import MobileBar from './MobileBar';
import MobileHeader from './MobileHeader';
import PageView from './PageView';
import Sidebar from './Sidebar';
import StatusBar from './StatusBar';
import TabStrip from './TabStrip';
import { currentOf, useTabs } from './useTabs';
import WindowControls from './WindowControls';

type Props = {
  /** False while minimised to the cafe PC's taskbar. */
  visible: boolean;
  onMinimize: () => void;
  onClose: () => void;
  onReplayIntro: () => void;
};

const HOME = parseAddress('home') as Address;

/**
 * Amogh Navigator: an icon rail of pages, tabs that each keep their own
 * history, a voice address bar, a live starfield behind it all, and a guide.
 * On a phone the rail becomes a bottom bar and the tabs a single title.
 */
export default function BrowserShell({ visible, onMinimize, onClose, onReplayIntro }: Props) {
  const reducedMotion = useReducedMotion();
  const { tabs, tab, dispatch } = useTabs();
  const current = currentOf(tab);
  const address = useMemo(() => parseAddress(current) ?? HOME, [current]);

  const open = useCallback((to: string) => dispatch({ type: 'open', to }), [dispatch]);
  const navigate = useCallback((to: string) => dispatch({ type: 'navigate', to }), [dispatch]);
  const api = useMemo<BrowserApi>(() => ({ address, navigate, open }), [address, navigate, open]);

  // A click when a tab opens or closes, a soft whoosh when the page changes.
  const heard = useRef({ count: tabs.length, at: `${tab.id}|${current}` });
  useEffect(() => {
    const at = `${tab.id}|${current}`;
    if (tabs.length !== heard.current.count) playClick();
    else if (at !== heard.current.at) playSwoosh();
    heard.current = { count: tabs.length, at };
  }, [tabs.length, tab.id, current]);

  // The walkthrough opens each tab as Byte talks about it.
  const tour = useGuide();
  useEffect(() => {
    if (tour.mode !== 'tour' || tour.place !== 'browser') return;
    const step = TOUR.browser[tour.line];
    if (step) open(step.page);
  }, [tour.mode, tour.place, tour.line, open]);

  const showTips = useCallback(() => {
    playClick();
    guide.explore();
  }, []);

  const tabProps = {
    tabs,
    activeId: tab.id,
    onActivate: (id: string) => dispatch({ type: 'activate', id }),
    onClose: (id: string) => dispatch({ type: 'close', id }),
    onNew: () => open('home'),
    controls: <WindowControls onMinimize={onMinimize} onClose={onClose} />,
  };
  const menuProps = {
    active: address.page,
    onOpen: open,
    onTips: showTips,
    onReplayIntro,
    onCloseAll: () => dispatch({ type: 'reset' }),
  };

  return (
    <BrowserContext.Provider value={api}>
      <div className="relative flex h-full w-full overflow-hidden bg-space text-ink">
        {/* A slow line of light along the top edge: the browser is live. */}
        <span aria-hidden="true" className="gx-topline pointer-events-none absolute inset-x-0 top-0 z-30 h-px" />
        <LiveWallpaper paused={!visible} reducedMotion={reducedMotion} />
        <Sidebar {...menuProps} />

        <div className="relative z-10 flex min-w-0 flex-1 flex-col">
          <header className="gx-chrome relative z-20 shrink-0 backdrop-blur-xl">
            <TabStrip {...tabProps} />
            <MobileHeader {...tabProps} />
            <AddressBar
              address={address}
              canBack={tab.index > 0}
              canForward={tab.index < tab.history.length - 1}
              onBack={() => dispatch({ type: 'go', delta: -1 })}
              onForward={() => dispatch({ type: 'go', delta: 1 })}
              onReload={() => dispatch({ type: 'reload' })}
              onGo={navigate}
            />
            {/* The load line: one sweep per navigation. */}
            <span
              key={`${tab.id}|${current}|${tab.reloads}`}
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 -bottom-px h-px origin-left bg-gradient-to-r from-accent/0 via-accent/80 to-accent/0"
              style={{ animation: 'nav-sweep 700ms ease-out both' }}
            />
          </header>
          <PageView tab={tab} address={address} reducedMotion={reducedMotion} />
          <StatusBar address={address} tabCount={tabs.length} />
          <MobileBar {...menuProps} />
        </div>

      </div>
    </BrowserContext.Provider>
  );
}
