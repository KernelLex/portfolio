import { ArrowUpRight, Globe } from 'lucide-react';
import { useBrowser } from '../../browser/BrowserContext';
import { MEDIA } from '../../content/browser';
import { FRAMEABLE } from '../../content/links';

/**
 * A live site, in a Navigator tab. Only the portfolio's own links that allow
 * framing are opened here; anything else typed into the address bar is not.
 */
export default function WebView() {
  const { address } = useBrowser();
  const url = address.query.get('url') ?? '';
  const allowed = FRAMEABLE.includes(url);
  const host = allowed ? new URL(url).host : url;

  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-white/[0.06] bg-space/60 px-4 py-2 text-xs">
        <Globe className="h-3.5 w-3.5 shrink-0 text-accent" strokeWidth={1.8} />
        <span className="truncate font-mono text-ink">{host}</span>
        <span className="hidden text-ink-muted md:inline">· {MEDIA.liveSite}</span>
        {allowed && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex shrink-0 items-center gap-1 font-mono text-[11px] text-ink-muted transition-colors hover:text-accent"
          >
            {MEDIA.newTab}
            <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
          </a>
        )}
      </div>
      {allowed ? (
        <iframe
          src={url}
          title={host}
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
          referrerPolicy="no-referrer"
          className="min-h-0 w-full flex-1 border-0 bg-white"
        />
      ) : (
        <p className="m-auto max-w-sm px-6 text-center text-sm text-ink-muted">{MEDIA.notAllowed}</p>
      )}
    </div>
  );
}
