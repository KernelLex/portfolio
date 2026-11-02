import type { Clip } from '../content/links';

/** A project's short in a phone-shaped frame, for case studies. Loads nothing until played. */
export default function ClipPlayer({ clip, className = '' }: { clip: Clip; className?: string }) {
  return (
    <figure className={`mx-auto w-full max-w-[19rem] ${className}`}>
      <div className="relative overflow-hidden rounded-[2rem] border-[6px] border-[#1c2433] bg-black shadow-[0_30px_70px_rgba(0,0,0,0.55),0_0_0_1px_rgb(245_163_92/0.2)]">
        <span aria-hidden="true" className="absolute top-2 left-1/2 z-10 h-1.5 w-14 -translate-x-1/2 rounded-full bg-[#1c2433]" />
        <video src={clip.src} poster={clip.poster} controls playsInline preload="none" aria-label={clip.title} className="block aspect-[9/16] w-full object-cover" />
      </div>
    </figure>
  );
}
