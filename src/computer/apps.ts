import type { ComponentType } from 'react';
import { APP_LABELS } from '../content/desktop';
import { NavigatorIcon, NotepadIcon, TerminalIcon, TrashIcon } from './icons';

export type AppId = keyof typeof APP_LABELS;
/** Everything except the browser opens as an ordinary window. */
export type WindowAppId = Exclude<AppId, 'navigator'>;

export type AppMeta = {
  id: AppId;
  label: string;
  Icon: ComponentType<{ className?: string }>;
};

/** Desktop order, top to bottom. */
export const APPS: ReadonlyArray<AppMeta> = [
  { id: 'navigator', label: APP_LABELS.navigator, Icon: NavigatorIcon },
  { id: 'readme', label: APP_LABELS.readme, Icon: NotepadIcon },
  { id: 'terminal', label: APP_LABELS.terminal, Icon: TerminalIcon },
  { id: 'trash', label: APP_LABELS.trash, Icon: TrashIcon },
];

export const appMeta = (id: AppId): AppMeta => APPS.find((a) => a.id === id) ?? APPS[0];

/** Where the browser launches from, or minimises to, on screen right now. */
export const rectOf = (selector: string): DOMRect | null =>
  document.querySelector(selector)?.getBoundingClientRect() ?? null;
