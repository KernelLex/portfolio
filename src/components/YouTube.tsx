import { useState } from 'react';
import { Play } from 'lucide-react';
import { MEDIA } from '../content/browser';
import type { Video } from '../content/links';

type Props = {
  video: Video;
  /** Start and stop points in seconds, for cutting a short from a long video. */
  start?: number;
  end?: number;
  className?: string;
};

/**
 * A YouTube video behind a still: nothing from YouTube runs until the visitor
 * presses play, and then only through the privacy-enhanced domain.
 */
export default function YouTube({ video, start, end, className = '' }: Props) {
  const [playing, setPlaying] = useState(false);
  const params = new URLSearchParams({ autoplay: '1', rel: '0', modestbranding: '1', playsinline: '1' });
  if (start) params.set('start', String(start));
  if (end) params.set('end', String(end));

  return (
    <figure className={className}>
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/[0.08] bg-black">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.id}?${params}`}
            title={video.title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <button type="button" onClick={() => setPlaying(true)} aria-label={MEDIA.play(video.title)} className="group absolute inset-0">
            <img
              src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover opacity-70 transition-opacity duration-300 group-hover:opacity-90"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-space/90 via-space/20 to-transparent" />
            <span className="absolute top-1/2 left-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-accent/50 bg-space/70 text-accent backdrop-blur transition-transform duration-300 group-hover:scale-105">
              <Play className="ml-1 h-6 w-6" strokeWidth={1.8} fill="currentColor" />
            </span>
            <span className="absolute bottom-4 left-5 font-mono text-xs tracking-[0.14em] text-ink uppercase">{video.title}</span>
          </button>
        )}
      </div>
      <figcaption className="mt-2 text-[11px] text-ink-muted">{MEDIA.youtubeNote}</figcaption>
    </figure>
  );
}
