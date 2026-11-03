import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import {
  BookOpen,
  Briefcase,
  Clapperboard,
  Gauge,
  Globe,
  House,
  MessageCircle,
  Route,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { parseAddress } from '../browser/address';
import { URL_SCHEME } from '../config';
import { PAGE_IDS, PAGES, type PageCopy, type PageId } from '../content/pages';

/** must: the core story (CLAUDE.md 5). nice: extras, set apart in the sidebar. hidden: reached by link only. */
export type Priority = 'must' | 'nice' | 'hidden';

export type PageEntry = PageCopy & {
  id: PageId;
  icon: LucideIcon;
  url: string;
  priority: Priority;
  /** Absent until the page is built; the shell shows "under construction". */
  component?: LazyExoticComponent<ComponentType>;
};

const ICONS: Record<PageId, LucideIcon> = {
  home: House,
  amoghpedia: BookOpen,
  story: Route,
  work: Briefcase,
  ask: MessageCircle,
  videos: Clapperboard,
  'side-builds': Wrench,
  control: Gauge,
  web: Globe,
};

const NICE: ReadonlySet<PageId> = new Set(['videos', 'side-builds', 'control']);
const HIDDEN: ReadonlySet<PageId> = new Set(['web']);

/** Each page is its own chunk, fetched the first time its tab opens. */
const BUILT: Partial<Record<PageId, LazyExoticComponent<ComponentType>>> = {
  home: lazy(() => import('./home/Home')),
  amoghpedia: lazy(() => import('./amoghpedia/Amoghpedia')),
  story: lazy(() => import('./story/Story')),
  work: lazy(() => import('./work/Work')),
  ask: lazy(() => import('./ask/Ask')),
  videos: lazy(() => import('./videos/Videos')),
  'side-builds': lazy(() => import('./side-builds/SideBuilds')),
  control: lazy(() => import('./control/Control')),
  web: lazy(() => import('./web/WebView')),
};

export const PAGE_LIST: ReadonlyArray<PageEntry> = PAGE_IDS.map((id) => ({
  id,
  ...PAGES[id],
  icon: ICONS[id],
  url: `${URL_SCHEME}://${id}`,
  priority: HIDDEN.has(id) ? 'hidden' : NICE.has(id) ? 'nice' : 'must',
  component: BUILT[id],
}));

const BY_ID = new Map(PAGE_LIST.map((p) => [p.id, p]));
export const pageEntry = (id: PageId): PageEntry => BY_ID.get(id) ?? PAGE_LIST[0];

/** Pages with a place in the sidebar and the phone's menus. */
export const LISTED_PAGES = PAGE_LIST.filter((p) => p.priority !== 'hidden');

/** A tab's title: the page's, or for a live site, its host name. */
export function titleOf(raw: string): string {
  const address = parseAddress(raw);
  if (!address) return PAGE_LIST[0].title;
  if (address.page === 'web') {
    try {
      return new URL(address.query.get('url') ?? '').host;
    } catch {
      /* fall through to the page title */
    }
  }
  return pageEntry(address.page).title;
}

/** The phone's bottom bar; everything else sits behind "More". */
export const MOBILE_MAIN: ReadonlyArray<PageId> = ['home', 'story', 'work', 'side-builds', 'amoghpedia', 'ask'];
