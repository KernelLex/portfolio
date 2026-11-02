import { Suspense, lazy, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { timings } from '../config';
import { rectOf } from './apps';

const BrowserShell = lazy(() => import('../browser/BrowserShell'));

type Props = {
  mode: 'open' | 'minimized';
  /** Where the window grows from on first launch: the icon that was opened. */
  launchFrom: DOMRect | null;
  reducedMotion: boolean;
  onMinimized: () => void;
  onClosed: () => void;
  onReplay: () => void;
};

const TASKBAR_BUTTON = '[data-taskbar="navigator"]';

/**
 * The browser as a window on the cafe PC. It grows out of whatever launched it
 * to fill the screen, shrinks into its taskbar button when minimised, and
 * grows back out of it when restored.
 *
 * Only the frame animates. The shell inside is laid out at full viewport size
 * the whole time, so the window reveals it rather than reflowing it 60 times
 * a second.
 */
export default function BrowserWindow({ mode, launchFrom, reducedMotion, onMinimized, onClosed, onReplay }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const previous = useRef<Props['mode'] | null>(null);
  const busy = useRef(false);

  const fullRect = () => ({ left: 0, top: 0, width: window.innerWidth, height: window.innerHeight });
  const settle = (el: HTMLElement) => gsap.set(el, { clearProps: 'left,top,width,height,borderRadius,opacity' });

  // Grow on first launch, and again whenever it is restored from the taskbar.
  useLayoutEffect(() => {
    const el = frameRef.current;
    const content = contentRef.current;
    const was = previous.current;
    previous.current = mode;
    if (!el || !content || mode !== 'open' || was === 'open') return;

    const finish = () => {
      settle(el);
      gsap.set(content, { opacity: 1 });
      busy.current = false;
    };

    const from = was === 'minimized' ? rectOf(TASKBAR_BUTTON) : launchFrom;
    if (reducedMotion || !from) {
      finish();
      return;
    }

    busy.current = true;
    const tl = gsap.timeline({ onComplete: finish });
    tl.fromTo(
      el,
      { left: from.left, top: from.top, width: from.width, height: from.height, borderRadius: 14, opacity: 0.6 },
      { ...fullRect(), borderRadius: 0, opacity: 1, duration: timings.windowOpen / 1000, ease: 'power3.inOut' },
    ).fromTo(content, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power1.out' }, 0.06);

    // Killed mid-flight (React's double-invoked effects in development, or a
    // re-render), never leave the window stranded half-grown: land it, and let
    // the next run replay the opening from the start.
    return () => {
      tl.kill();
      finish();
      previous.current = was;
    };
  }, [mode, launchFrom, reducedMotion]);

  const minimize = () => {
    const el = frameRef.current;
    const to = rectOf(TASKBAR_BUTTON);
    if (!el || busy.current) return;
    if (reducedMotion || !to) {
      onMinimized();
      return;
    }
    busy.current = true;
    gsap.fromTo(el, fullRect(), {
      left: to.left,
      top: to.top,
      width: to.width,
      height: to.height,
      borderRadius: 10,
      opacity: 0.2,
      duration: 0.4,
      ease: 'power3.in',
      onComplete: () => {
        busy.current = false;
        onMinimized();
      },
    });
  };

  const close = () => {
    const el = frameRef.current;
    if (!el || busy.current) return;
    if (reducedMotion) {
      onClosed();
      return;
    }
    busy.current = true;
    gsap.to(el, { scale: 0.96, opacity: 0, duration: 0.22, ease: 'power2.in', onComplete: onClosed });
  };

  return (
    <div
      ref={frameRef}
      className={`fixed inset-0 z-[1000] overflow-hidden bg-surface shadow-[0_30px_80px_rgba(0,0,0,0.6)] ring-1 ring-white/15 ${
        mode === 'minimized' ? 'pointer-events-none invisible' : ''
      }`}
      aria-hidden={mode === 'minimized'}
    >
      <div ref={contentRef} className="absolute top-0 left-0 h-[100dvh] w-screen">
        <Suspense fallback={<div className="h-full w-full bg-space" />}>
          <BrowserShell visible={mode === 'open'} onMinimize={minimize} onClose={close} onReplayIntro={onReplay} />
        </Suspense>
      </div>
    </div>
  );
}
