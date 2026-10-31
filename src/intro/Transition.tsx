import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { timings } from '../config';

type Props = {
  /** Fired at full white - the moment to swap what sits underneath. */
  onPeak: () => void;
  /** Fired once the white has cleared. */
  onDone: () => void;
};

/**
 * The white flash that separates the two worlds. It is a plain overlay: the
 * swap from street to boot screen happens underneath it, at peak white, so the
 * viewer never sees a cut.
 */
export default function Transition({ onPeak, onDone }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const onPeakRef = useRef(onPeak);
  const onDoneRef = useRef(onDone);
  onPeakRef.current = onPeak;
  onDoneRef.current = onDone;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const inMs = timings.whiteFlash * 0.4;
    const outMs = timings.whiteFlash * 0.6;

    const tl = gsap.timeline();
    tl.fromTo(
      el,
      { opacity: 0 },
      {
        opacity: 1,
        duration: inMs / 1000,
        ease: 'power2.out',
        onComplete: () => onPeakRef.current(),
      },
    ).to(el, {
      opacity: 0,
      duration: outMs / 1000,
      ease: 'power2.in',
      onComplete: () => onDoneRef.current(),
    });

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 bg-white opacity-0"
    />
  );
}
