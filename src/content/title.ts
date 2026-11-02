import { BROWSER_NAME } from '../config';

/** The title screen: what a visitor sees first, like a game booting. */
export const TITLE = {
  studio: 'KERNELLEX PRESENTS',
  name: 'AMOGH',
  subtitle: BROWSER_NAME.split(' ').slice(1).join(' ').toUpperCase() || BROWSER_NAME.toUpperCase(),
  tagline: 'A portfolio you play',
  loading: 'LOADING',
  /** Rotates under the loading bar. */
  flavour: ['Waking the city', 'Charging the neon', 'Starting the rain', 'Opening the cyber cafe', 'Warming up seat 03'],
  menu: [
    { id: 'explore', label: 'START GAME', hint: 'Explore on your own' },
    { id: 'tour', label: 'GUIDED TOUR', hint: 'Byte walks you through it' },
  ],
  press: 'PRESS ENTER',
  pressTouch: 'TAP TO START',
  controls: '↑ ↓ to choose · Enter to start',
  fullscreen: 'Plays in full screen · Esc to leave it',
  footer: '© 2026 Amogh P · built by voice with Wispr Flow',
} as const;

export type StartMode = (typeof TITLE.menu)[number]['id'];
