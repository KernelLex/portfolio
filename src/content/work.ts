import { LIVE, VIDEOS, type LiveSite, type Video } from './links';

/**
 * Client Work: one entry per case study. Facts only from CLAUDE.md section 3,
 * Amogh's life-story draft and the Nova catalogue. IIWM and Bogen Villa are
 * private clients: described, never linked. Vera ERP usage numbers stay out
 * until Amogh confirms the wording.
 */
export type CaseStudy = {
  slug: string;
  name: string;
  hook: string;
  /** What kind of work, in a word or two. */
  kind: string;
  tags: readonly string[];
  problem: string;
  built: readonly string[];
  result: string;
  stack: readonly string[];
  live?: LiveSite;
  /** Shown when there is no live link to share. */
  privacy?: string;
  video?: Video;
  /** Gradient for the cover, until there are screenshots. */
  tint: string;
};

export const WORK = {
  title: 'Client Work',
  lead: 'What two people built for real businesses: first websites, then the systems those businesses run on.',
  clientsHeading: 'Client projects',
  novaHeading: 'Nova: the products',
  novaLead:
    'Nova is the product line Amogh builds with Thushaar Rangan: ERP, CRM and HRMS, already built and running. Each began as a request from one company.',
  sections: { problem: 'The problem', built: 'What we built', result: 'Result', stack: 'Built with', watch: 'Watch' },
  live: 'Live',
  private: 'Private client',
  ask: (name: string) => `Tell me about ${name}`,
  askButton: 'Ask Amogh about this',
  back: 'All client work',
  previous: 'Previous',
  next: 'Next',
  missing: "That case study isn't here.",
} as const;

export const CLIENT_WORK: ReadonlyArray<CaseStudy> = [
  {
    slug: 'vera-erp',
    name: 'Vera ERP',
    kind: 'ERP system',
    hook: 'One place for a group of companies, with a private AI that never leaves the server.',
    tags: ['Multi-company ERP', 'Private AI'],
    problem:
      'While building websites, Amogh talked to people inside a client company and found a director struggling to see the details across the several companies he ran: Vera Enterprises, Schönes Leben and Hagan Modular.',
    built: [
      'One ERP for every company in the group: HR, sales to quotation to projects, purchase, logistics, Tally finances and documents from Google Drive.',
      'A private AI assistant on a local Ollama model, so company data never leaves the server.',
      'Attendance from Jibble, and the whole thing self-hosted on bare-metal Ubuntu behind nginx and a Cloudflare Tunnel.',
    ],
    result: 'In its main testing phase, with one of the group’s companies as the test bed. Built by Amogh and a friend; the two of them also built the Vera Enterprises website.',
    stack: ['ERPNext v15', 'Frappe HRMS (headless)', 'React', 'TypeScript', 'Tailwind', 'Ollama', 'Ubuntu', 'nginx', 'Cloudflare Tunnel'],
    live: LIVE.vera,
    video: VIDEOS.novaErp,
    tint: 'radial-gradient(ellipse at 20% 20%, rgb(245 163 92 / 0.35), transparent 60%), radial-gradient(ellipse at 90% 90%, rgb(139 108 255 / 0.3), transparent 60%)',
  },
  {
    slug: 'hrms',
    name: 'HRMS module',
    kind: 'HR system',
    hook: 'An HR suite that plugs into a client’s own ERP, without passing credentials over APIs.',
    tags: ['Indian HR & payroll', 'Integration'],
    problem:
      'A client who sells his own ERP to companies without an HR department wanted a separate HR module, linked into his ERP, without sending credentials directly through APIs.',
    built: [
      'An Indian HR suite: payroll, leave, hiring, performance, and income tax including Form 16.',
      'Bitemporal records, so any fact can be seen as it was on any past date, and dual approval for bank-detail changes.',
      'Linked both ways with the client’s ERP, and built to WCAG 2.1 AA.',
    ],
    result: 'Built and delivered: his ERP and the HR module work together both ways.',
    stack: ['Next.js', 'Drizzle', 'libSQL'],
    privacy: 'Private client: link not shared.',
    tint: 'radial-gradient(ellipse at 80% 15%, rgb(84 232 224 / 0.3), transparent 60%), radial-gradient(ellipse at 10% 90%, rgb(139 108 255 / 0.28), transparent 60%)',
  },
  {
    slug: 'secant',
    name: 'Secant',
    kind: 'Architecture studio',
    hook: 'The first yes, after six months of zero: a 3D interactive site for an architecture firm.',
    tags: ['3D website', 'First client'],
    problem: 'Six months into freelancing, the two-person team still had no clients. Secant, an architecture firm, became the first.',
    built: ['A 3D interactive website, built with WebGL, Three.js and GSAP.'],
    result: 'Live at secant.in, and the project that led to Hazen Lights.',
    stack: ['Three.js', 'WebGL', 'GSAP'],
    live: LIVE.secant,
    tint: 'radial-gradient(ellipse at 30% 30%, rgb(233 235 242 / 0.22), transparent 60%), radial-gradient(ellipse at 85% 85%, rgb(84 232 224 / 0.2), transparent 60%)',
  },
  {
    slug: 'hazen',
    name: 'Hazen Lights',
    kind: 'Architectural lighting',
    hook: 'No AI slop: a lighting brand’s site and store with custom 3D, one of a kind.',
    tags: ['3D website', 'E-commerce'],
    problem: 'Secant led to Hazen Lights, an architectural lighting company. The team refused to make another generic site.',
    built: ['A brand site and e-commerce store with custom 3D models and animation.'],
    result: 'Live at hazenlights.com.',
    stack: ['Three.js', 'GSAP', 'E-commerce'],
    live: LIVE.hazen,
    tint: 'radial-gradient(ellipse at 50% 0%, rgb(245 163 92 / 0.4), transparent 55%), radial-gradient(ellipse at 50% 100%, rgb(20 26 38 / 0.9), transparent 60%)',
  },
  {
    slug: 'iiwm',
    name: 'IIWM Bangalore',
    kind: 'Wedding business school',
    hook: 'An editorial, atelier-style marketing site for a wedding business school.',
    tags: ['Website', 'Editorial design'],
    problem: 'A wedding business needed a site for its business school.',
    built: ['A marketing site with an editorial "Atelier" design.'],
    result: 'Delivered.',
    stack: ['Web'],
    privacy: 'Private client: link not shared.',
    tint: 'radial-gradient(ellipse at 25% 75%, rgb(255 95 162 / 0.25), transparent 60%), radial-gradient(ellipse at 80% 20%, rgb(245 163 92 / 0.22), transparent 60%)',
  },
  {
    slug: 'bogen-villa',
    name: 'Bogen Villa',
    kind: 'Wedding venue',
    hook: 'The venue site for the same wedding business.',
    tags: ['Website'],
    problem: 'The wedding business’s venue needed its own site.',
    built: ['A website for the venue.'],
    result: 'Delivered.',
    stack: ['Web'],
    privacy: 'Private client: link not shared.',
    tint: 'radial-gradient(ellipse at 70% 70%, rgb(139 108 255 / 0.28), transparent 60%), radial-gradient(ellipse at 20% 20%, rgb(255 95 162 / 0.18), transparent 60%)',
  },
];

export const NOVA_PRODUCTS: ReadonlyArray<CaseStudy> = [
  {
    slug: 'nova-erp',
    name: 'Nova ERP',
    kind: 'Product',
    hook: 'Quote to cash to accounts, across more than one company.',
    tags: ['ERP', 'Multi-company'],
    problem: 'A business that quotes, builds and delivers, across several legal entities, without separate systems to keep in step.',
    built: [
      'A quotation studio: site measurements with photos, a bill of quantities from a vendor price list of over 7,000 items, and pricing against a gross-profit target.',
      'Won quotes become projects, with purchase, goods receipt, site inventory and service tickets; logistics that need proof of delivery.',
      'Accounting data from Tally, reconciled against the company’s own books to within about one percent; documents read into records with a review queue; an assistant that answers questions about the company’s own figures.',
    ],
    result: 'Built and running. The walkthrough is recorded on the Vera Enterprises workspaces.',
    stack: ['ERP', 'Tally', 'Multi-company'],
    video: VIDEOS.novaErp,
    tint: 'radial-gradient(ellipse at 15% 25%, rgb(245 163 92 / 0.32), transparent 60%), radial-gradient(ellipse at 85% 80%, rgb(84 232 224 / 0.22), transparent 60%)',
  },
  {
    slug: 'nova-crm',
    name: 'Nova CRM',
    kind: 'Product',
    hook: 'First call to last payment, for businesses that sell finite inventory.',
    tags: ['CRM', 'Billing'],
    problem:
      'Small sales teams run on a spreadsheet of what they sell, a phone full of chats and a separate billing package, so the same thing gets promised twice.',
    built: [
      'One timeline per client: calls, messages, quotes, bookings, invoices and payments.',
      'Inventory that knows its own calendar, checked again at booking so nothing is sold twice.',
      'Billing that survives an audit: gap-free numbering per financial year, tax withheld at source, ageing and reminders. Built first for outdoor media.',
    ],
    result: 'Built and running.',
    stack: ['CRM', 'Invoicing', 'Role-based access'],
    video: VIDEOS.novaCrm,
    tint: 'radial-gradient(ellipse at 80% 20%, rgb(255 95 162 / 0.26), transparent 60%), radial-gradient(ellipse at 20% 85%, rgb(139 108 255 / 0.28), transparent 60%)',
  },
  {
    slug: 'nova-hrms',
    name: 'Nova HRMS',
    kind: 'Product',
    hook: 'The people and pay side, correct every month.',
    tags: ['HRMS', 'Payroll & tax'],
    problem: 'Pay, leave, hiring, performance and tax all have to be right every month, and agree with each other at year end.',
    built: [
      'Payroll gross to net, paid by the day for joiners, leavers and mid-month raises, with a check before every posting.',
      'Tax that reconciles: a year-end certificate built from exactly what payroll deducted.',
      'Dated history on every fact, and statutory rates you can edit yourself. Built and automatically tested to WCAG 2.1 AA.',
    ],
    result: 'Built and running.',
    stack: ['HRMS', 'Payroll', 'WCAG 2.1 AA'],
    video: VIDEOS.novaHrms,
    tint: 'radial-gradient(ellipse at 30% 80%, rgb(84 232 224 / 0.28), transparent 60%), radial-gradient(ellipse at 75% 15%, rgb(245 163 92 / 0.24), transparent 60%)',
  },
];

export const ALL_WORK: ReadonlyArray<CaseStudy> = [...CLIENT_WORK, ...NOVA_PRODUCTS];
