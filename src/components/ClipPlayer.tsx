import type { Clip } from '../content/links';

/** A project's walkthrough video, for case studies. Loads nothing until played. */
export default function ClipPlayer({ clip, className = '' }: { clip: Clip; className?: string }) {
  return (
    <figure className={className}>
      <div className="overflow-hidden rounded-2xl border border-white/[0.1] bg-black shadow-[0_24px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgb(245_163_92/0.15)]">
        <video src={clip.src} poster={clip.poster} controls playsInline preload="none" aria-label={clip.title} className="block aspect-video w-full" />
      </div>
    </figure>
  );
}
