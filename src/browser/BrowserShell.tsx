import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { storageKeys } from '../config';
import { playClick, playSwoosh } from '../lib/sound';
import { readFlag, writeFlag } from '../lib/storage';
import { useReducedMotion } from '../lib/useReducedMotion';
import { parseAddress, type Address } from './address';
import AddressBar from './AddressBar';
import { BrowserContext, type BrowserApi } from './BrowserContext';
import Guide from './Guide';
import LiveWallpaper from './LiveWallpaper';
import MobileBar from './MobileBar';
import MobileHeader from './MobileHeader';
import PageView from './PageView';
import Sidebar from './Sidebar';
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
/** First visit: let the window finish opening before the guide says hello. */
const GUIDE_DELAY_MS = 1100;

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
  const [tip, setTip] = useState<number | null>(null);

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

  useEffect(() => {
    if (!visible || readFlag(storageKeys.guideSeen, false)) return;
    const t = window.setTimeout(() => setTip((v) => v ?? 0), GUIDE_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [visible]);

  const showTips = useCallback(() => {
    playClick();
    setTip(0);
  }, []);
  const closeTips = useCallback(() => {
    writeFlag(storageKeys.guideSeen, true);
    setTip(null);
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
        <LiveWallpaper paused={!visible} reducedMotion={reducedMotion} />
        <Sidebar {...menuProps} />

        <div className="relative z-10 flex min-w-0 flex-1 flex-col">
          <header className="relative z-20 shrink-0 border-b border-white/[0.06] bg-space/40 backdrop-blur-xl">
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
          </header>
          <PageView tab={tab} address={address} reducedMotion={reducedMotion} />
          <MobileBar {...menuProps} />
        </div>

        {tip !== null && <Guide step={tip} onStep={setTip} onClose={closeTips} reducedMotion={reducedMotion} />}
      </div>
    </BrowserContext.Provider>
  );
}
