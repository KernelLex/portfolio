import { Component, Suspense, lazy, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useSkin } from '../lib/skin';

const Starfield = lazy(() => import('./Starfield'));

/** No WebGL, or it failed: the static sky underneath is the whole wallpaper. */
class Quiet extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const subscribeVisibility = (fn: () => void) => {
  document.addEventListener('visibilitychange', fn);
  return () => document.removeEventListener('visibilitychange', fn);
};

type Props = {
  /** Nobody can see it (minimised, or covered): nothing to draw for. */
  paused: boolean;
  reducedMotion: boolean;
  /** Paint the deep-space gradient underneath; off when something else is the backdrop. */
  sky?: boolean;
};

/**
 * A static deep-space gradient, with the moving starfield faded in on top once
 * it has loaded. Under reduced motion the gradient is all there is.
 */
export default function LiveWallpaper({ paused, reducedMotion, sky = true }: Props) {
  const hidden = useSyncExternalStore(subscribeVisibility, () => document.hidden, () => false);
  const [ready, setReady] = useState(false);
  const skin = useSkin();

  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 ${sky ? 'space-sky' : ''}`}>
      {!reducedMotion && (
        <div className={`absolute inset-0 transition-opacity duration-[1800ms] ease-out ${ready ? 'opacity-100' : 'opacity-0'}`}>
          <Quiet>
            <Suspense fallback={null}>
              <Starfield key={skin} pixel={skin === 'pixel'} paused={paused || hidden} onReady={() => setReady(true)} />
            </Suspense>
          </Quiet>
        </div>
      )}
    </div>
  );
}
