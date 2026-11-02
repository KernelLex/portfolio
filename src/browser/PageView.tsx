import { Suspense, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import HudCorners from '../components/HudCorners';
import { CHROME } from '../content/browser';
import { pageEntry } from '../pages/registry';
import UnderConstruction from '../pages/UnderConstruction';
import type { Address } from './address';
import type { Tab } from './useTabs';

type Props = {
  tab: Tab;
  address: Address;
  reducedMotion: boolean;
};

/**
 * The current tab's page. Each visit is a fresh mount - switching tabs,
 * navigating and reloading all change the key - and fades in, unless the
 * visitor prefers less motion.
 */
export default function PageView({ tab, address, reducedMotion }: Props) {
  const scrollRef = useRef<HTMLElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const entry = pageEntry(address.page);
  const Page = entry.component;
  const key = `${tab.id}|${address.raw}|${tab.reloads}`;

  useLayoutEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    const sheet = sheetRef.current;
    if (reducedMotion || !sheet) return;
    const tween = gsap.fromTo(
      sheet,
      { autoAlpha: 0, y: 10 },
      { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out', clearProps: 'opacity,visibility,transform' },
    );
    return () => {
      tween.kill();
    };
  }, [key, reducedMotion]);

  return (
    <div className="relative min-h-0 flex-1">
      <main ref={scrollRef} id="page-panel" aria-label={entry.title} className="absolute inset-0 overflow-y-auto overscroll-contain">
        <div ref={sheetRef} key={key} className="min-h-full">
          <Suspense
            fallback={
              <p className="grid h-full min-h-40 place-items-center font-mono text-xs text-ink-muted" style={{ animation: 'fade-in 400ms ease-out 300ms both' }}>
                {CHROME.loading}…
              </p>
            }
          >
            {Page ? <Page /> : <UnderConstruction entry={entry} />}
          </Suspense>
        </div>
      </main>
      {/* Viewfinder marks at the corners of the page, fixed while it scrolls. */}
      <HudCorners inset={8} size={12} className="hidden sm:block" />
    </div>
  );
}
