/**
 * Every outside link on the site, in one place. Only links Amogh has given.
 * IIWM and Bogen Villa are private clients: described, never linked.
 */
/**
 * Amogh's résumé as a PDF. The public copy leaves out the personal-details
 * block (home address, birth date, family contacts).
 */
export const RESUME = { href: `${import.meta.env.BASE_URL}Amogh-P-Resume.pdf`, file: 'Amogh-P-Resume.pdf', label: 'Download résumé', format: 'PDF' } as const;

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

export type Clip = { src: string; poster: string; title: string; audio: boolean };

const clip = (name: string, title: string, audio: boolean): Clip => ({
  src: `${import.meta.env.BASE_URL}videos/${name}.mp4`,
  poster: `${import.meta.env.BASE_URL}videos/${name}.jpg`,
  title,
  audio,
});

/**
 * Amogh's project videos (from his Google Drive), as 720p walkthroughs
 * served by the site itself: no third-party player, nothing tracking.
 */
export const CLIPS = {
  erp: clip('erp', 'Nova ERP', false),
  crm: clip('crm', 'Nova CRM', true),
  hrms: clip('hrms', 'Nova HRMS', true),
  metakai: clip('metakai', 'Metakai', true),
  cyberbane: clip('cyberbane', 'CyberBane', false),
} as const;
