/**
 * Every outside link on the site, in one place. Only links Amogh has given.
 * IIWM and Bogen Villa are private clients: described, never linked.
 */
export const PROFILES = {
  github: { label: 'GitHub', handle: 'KernelLex', href: 'https://github.com/KernelLex' },
  linkedin: { label: 'LinkedIn', handle: 'amogh-prashanth', href: 'https://www.linkedin.com/in/amogh-prashanth-393b37319/' },
} as const;

export type LiveSite = { label: string; href: string; frameable: boolean };

/**
 * frameable: the site allows being shown inside another page, so Navigator can
 * open it in a tab. Checked 2 Nov 2026; Secant and Throttle send
 * X-Frame-Options: DENY and open in a new browser tab instead.
 */
export const LIVE = {
  secant: { label: 'secant.in', href: 'https://secant.in', frameable: false },
  hazen: { label: 'hazenlights.com', href: 'https://hazenlights.com', frameable: true },
  vera: { label: 'veraenterprises.in', href: 'https://veraenterprises.in', frameable: true },
  truecommit: { label: 'truecommit-tawny.vercel.app', href: 'https://truecommit-tawny.vercel.app', frameable: true },
  throttle: { label: 'throttle-delta.vercel.app', href: 'https://throttle-delta.vercel.app', frameable: false },
} satisfies Record<string, LiveSite>;

/** Only these may be framed by the in-browser viewer. */
export const FRAMEABLE: ReadonlyArray<string> = Object.values(LIVE)
  .filter((site) => site.frameable)
  .map((site) => site.href);

/** Product walkthroughs on YouTube (unlisted; uploaded by Thushaar K N). */
export const VIDEOS = {
  novaErp: { id: 'OdFdVJgRYs4', title: 'Nova ERP walkthrough' },
  novaCrm: { id: 'lO3SrFwmit0', title: 'Nova CRM walkthrough' },
  novaHrms: { id: 'yHgRfNgJLLE', title: 'Nova HRMS walkthrough' },
} as const;

export type Video = (typeof VIDEOS)[keyof typeof VIDEOS];
