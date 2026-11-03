import { useEffect, useState } from 'react';
import { ArrowUpRight, ChevronRight, MessageCircle, Play, ThumbsDown, ThumbsUp, VolumeX } from 'lucide-react';
import { askAddress } from '../../browser/address';
import { useBrowser } from '../../browser/BrowserContext';
import AvatarSprite from '../../components/AvatarSprite';
import { VIDEOS, VIDEOS_PAGE as P, type Video } from '../../content/videos';
import { playClick } from '../../lib/sound';

type Vote = 'like' | 'dislike';

// The visitor's own likes, for this visit. Nobody else's are counted or shown.
const votes: Record<string, Vote | undefined> = {};
let autoplayOn = true;
/** After a video ends, this long before the next one starts. */
const NEXT_IN_S = 5;

const PILL = 'inline-flex h-9 items-center gap-2 rounded-full bg-white/[0.08] px-4 text-sm text-ink transition-colors hover:bg-white/[0.14]';

/** A thumbnail with its length in the corner, like any video site. */
function Thumb({ video, className = '' }: { video: Video; className?: string }) {
  return (
    <span className={`relative block overflow-hidden rounded-xl bg-black ${className}`}>
      <img src={video.clip.poster} alt="" loading="lazy" className="aspect-video w-full object-cover" />
      <span className="absolute right-1.5 bottom-1.5 rounded bg-black/85 px-1.5 py-0.5 font-mono text-[11px] text-white">{video.duration}</span>
    </span>
  );
}

/**
 * Videos, laid out like a watch page: the player, the title, the channel and
 * its actions, a description, and what to watch next down the side. ?v=<id>
 * picks the video; arriving that way (a click) starts it playing.
 */
export default function Videos() {
  const { address, navigate, open } = useBrowser();
  const id = address.query.get('v');
  const video = VIDEOS.find((v) => v.id === id) ?? VIDEOS[0];
  const index = VIDEOS.indexOf(video);
  const next = VIDEOS[(index + 1) % VIDEOS.length];
  const others = [...VIDEOS.slice(index + 1), ...VIDEOS.slice(0, index)];

  const [vote, setVote] = useState<Vote | undefined>(votes[video.id]);
  const [autoplay, setAutoplay] = useState(autoplayOn);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setVote(votes[video.id]);
    setCountdown(null);
    setExpanded(false);
  }, [video.id]);

  const watch = (v: Video) => {
    playClick();
    navigate(`videos?v=${v.id}`);
  };

  // Up next: a few seconds' warning, then the next one plays.
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      navigate(`videos?v=${next.id}`);
      return;
    }
    const t = window.setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [countdown, next.id, navigate]);

  const cast = (choice: Vote) => {
    playClick();
    const value = vote === choice ? undefined : choice;
    votes[video.id] = value;
    setVote(value);
  };

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 pt-5 pb-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem] xl:px-10 2xl:max-w-[1600px]">
      {/* --- the watch column ------------------------------------------------ */}
      <div className="min-w-0">
        <div className="relative overflow-hidden rounded-2xl bg-black shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
          <video
            key={video.id}
            src={video.clip.src}
            poster={video.clip.poster}
            controls
            playsInline
            autoPlay={id !== null}
            preload="metadata"
            aria-label={video.title}
            onPlay={() => setCountdown(null)}
            onEnded={() => autoplay && setCountdown(NEXT_IN_S)}
            className="block aspect-video w-full"
          />
          {countdown !== null && (
            <div className="absolute inset-0 grid place-items-center bg-black/75 p-4 backdrop-blur-sm" style={{ animation: 'fade-in 200ms ease-out both' }}>
              <div className="flex w-full max-w-sm flex-col items-center gap-3 text-center">
                <p className="font-mono text-xs text-ink-muted">{P.nextIn(countdown)}</p>
                <Thumb video={next} className="w-56" />
                <p className="text-sm font-medium text-ink">{next.title}</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setCountdown(null)} className={PILL}>
                    {P.cancel}
                  </button>
                  <button type="button" onClick={() => watch(next)} className="inline-flex h-9 items-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-space hover:opacity-90">
                    <Play className="h-4 w-4" fill="currentColor" strokeWidth={0} />
                    {P.playNow}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <h1 className="mt-4 text-xl leading-snug font-semibold text-ink sm:text-2xl">{video.title}</h1>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="relative h-10 w-10 shrink-0 overflow-hidden bg-[radial-gradient(circle_at_50%_36%,#7a5598,#33264f_60%)] [clip-path:circle(50%)]">
              <AvatarSprite label={P.channel} className="absolute -bottom-0.5 left-1/2 h-11 w-11 -translate-x-1/2" />
            </span>
            <span>
              <span className="block text-[15px] font-medium text-ink">{P.channel}</span>
              <span className="block text-xs text-ink-muted">{P.handle}</span>
            </span>
            <a href={P.followHref} target="_blank" rel="noopener noreferrer" title={P.followTitle} className="ml-2 inline-flex h-9 items-center rounded-full bg-ink px-4 text-sm font-medium text-space hover:opacity-90">
              {P.follow}
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex overflow-hidden rounded-full bg-white/[0.08]">
              <button type="button" onClick={() => cast('like')} aria-pressed={vote === 'like'} className="inline-flex h-9 items-center gap-2 px-4 text-sm text-ink hover:bg-white/[0.08]">
                <ThumbsUp className={`h-4 w-4 ${vote === 'like' ? 'text-accent' : ''}`} fill={vote === 'like' ? 'currentColor' : 'none'} strokeWidth={1.8} />
                {vote === 'like' ? P.liked : P.like}
              </button>
              <span className="my-2 w-px bg-white/15" aria-hidden="true" />
              <button type="button" onClick={() => cast('dislike')} aria-pressed={vote === 'dislike'} aria-label={P.dislike} title={P.dislike} className="inline-flex h-9 items-center px-4 text-ink hover:bg-white/[0.08]">
                <ThumbsDown className={`h-4 w-4 ${vote === 'dislike' ? 'text-accent' : ''}`} fill={vote === 'dislike' ? 'currentColor' : 'none'} strokeWidth={1.8} />
              </button>
            </div>
            <button type="button" onClick={() => open(askAddress(P.askAbout(video.topic)))} className={PILL}>
              <MessageCircle className="h-4 w-4" strokeWidth={1.8} />
              {P.ask}
            </button>
            <button type="button" onClick={() => open(video.link.to)} className={PILL}>
              {video.link.label}
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {/* The description box: tags first, the rest on request. */}
        <div className="mt-4 rounded-xl bg-white/[0.06] p-4 text-sm leading-relaxed text-ink/90">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-medium text-ink">
            {video.tags.map((t) => (
              <span key={t}>#{t.replace(/\s+/g, '')}</span>
            ))}
            {!video.clip.audio && (
              <span className="inline-flex items-center gap-1 font-normal text-ink-muted">
                <VolumeX className="h-3.5 w-3.5" strokeWidth={1.8} />
                {P.noSound}
              </span>
            )}
          </p>
          <div className={`mt-2 space-y-2 ${expanded ? '' : 'line-clamp-2'}`}>
            {video.description.map((line) => (
              <p key={line}>{line}</p>
            ))}
            {expanded && <p className="text-xs text-ink-muted">{P.hosted}</p>}
          </div>
          <button type="button" onClick={() => setExpanded((e) => !e)} className="mt-2 text-[13px] font-medium text-ink hover:underline">
            {expanded ? P.less : P.more}
          </button>
        </div>
      </div>

      {/* --- up next --------------------------------------------------------- */}
      <aside className="min-w-0">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-medium text-ink">{P.upNext}</h2>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-muted">
            {P.autoplay}
            <input
              type="checkbox"
              checked={autoplay}
              onChange={(e) => {
                autoplayOn = e.target.checked;
                setAutoplay(e.target.checked);
              }}
              className="h-4 w-4 accent-[#f5a35c]"
            />
          </label>
        </div>
        <ol className="space-y-3">
          {others.map((v) => (
            <li key={v.id}>
              <button type="button" onClick={() => watch(v)} className="group flex w-full gap-3 rounded-xl p-1.5 text-left transition-colors hover:bg-white/[0.06]">
                <Thumb video={v} className="w-40 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-sm leading-snug font-medium text-ink group-hover:text-accent">{v.title}</span>
                  <span className="mt-1 block text-xs text-ink-muted">{P.channel}</span>
                  <span className="mt-0.5 block truncate text-xs text-ink-muted">{v.tags.join(' · ')}</span>
                </span>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-ink-muted opacity-0 transition-opacity group-hover:opacity-100" strokeWidth={1.8} />
              </button>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}
