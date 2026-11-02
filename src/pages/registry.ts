import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import {
  Aperture,
  BookOpen,
  Briefcase,
  Clapperboard,
  Gauge,
  House,
  MessageCircle,
  Receipt,
  Route,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { URL_SCHEME } from '../config';
import { PAGE_IDS, PAGES, type PageCopy, type PageId } from '../content/pages';

/** must: the core story (CLAUDE.md 5). nice: extras, set apart in the sidebar. */
export type Priority = 'must' | 'nice';

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
  'prompt-lens': Aperture,
  ask: MessageCircle,
  receipts: Receipt,
  shorts: Clapperboard,
  'side-builds': Wrench,
  control: Gauge,
};

const NICE: ReadonlySet<PageId> = new Set(['shorts', 'side-builds', 'control']);

/** Each page is its own chunk, fetched the first time its tab opens. */
const BUILT: Partial<Record<PageId, LazyExoticComponent<ComponentType>>> = {
  home: lazy(() => import('./home/Home')),
  amoghpedia: lazy(() => import('./amoghpedia/Amoghpedia')),
};

export const PAGE_LIST: ReadonlyArray<PageEntry> = PAGE_IDS.map((id) => ({
  id,
  ...PAGES[id],
  icon: ICONS[id],
  url: `${URL_SCHEME}://${id}`,
  priority: NICE.has(id) ? 'nice' : 'must',
  component: BUILT[id],
}));

const BY_ID = new Map(PAGE_LIST.map((p) => [p.id, p]));
export const pageEntry = (id: PageId): PageEntry => BY_ID.get(id) ?? PAGE_LIST[0];

/** The phone's bottom bar; everything else sits behind "More". */
export const MOBILE_MAIN: ReadonlyArray<PageId> = ['home', 'story', 'work', 'prompt-lens', 'ask'];
