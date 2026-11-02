import { ArrowUpRight, PanelTop } from 'lucide-react';
import { useBrowser } from '../browser/BrowserContext';
import { MEDIA } from '../content/browser';
import type { LiveSite } from '../content/links';
import { playClick } from '../lib/sound';

/**
 * Ways to open a live site: inside Navigator, in a tab of its own, where the
 * site allows being framed; otherwise in a new tab of the real browser.
 */
export default function LiveLinks({ site }: { site: LiveSite }) {
  const { open } = useBrowser();
  return (
    <div className="flex flex-wrap gap-2">
      {site.frameable && (
        <button
          type="button"
          onClick={() => {
            playClick();
            open(`web?url=${encodeURIComponent(site.href)}`);
          }}
          className="flex h-9 items-center gap-2 rounded-lg bg-accent px-3.5 text-sm font-medium text-space transition-opacity hover:opacity-90"
        >
          <PanelTop className="h-4 w-4" strokeWidth={1.8} />
          {MEDIA.openHere}
        </button>
      )}
      <a
        href={site.href}
        target="_blank"
        rel="noopener noreferrer"
        title={MEDIA.newTab}
        className="flex h-9 items-center gap-1.5 rounded-lg border border-white/[0.12] px-3.5 font-mono text-xs text-ink transition-colors hover:border-accent/50 hover:text-accent"
      >
        {site.label}
        <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
      </a>
    </div>
  );
}
