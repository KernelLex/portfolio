import { LIVE, PROFILES } from './links';
import type { PageId } from './pages';

/**
 * Amoghpedia: the encyclopedia article. Facts only from CLAUDE.md section 3,
 * Amogh's life-story draft and his résumé.
 *
 * Inline markup in paragraphs:
 *   [[work|Client Work]]   a link to another tab (shows a preview on hover)
 *   {ref:secant}           a citation, numbered by first appearance
 *   {cn}                   a playful [citation needed]
 *   **bold**
 * A paragraph starting "- " is a list item; one starting "> " is a quote.
 */

export type Citation = { label: string; href?: string; note?: string };

export const CITATIONS = {
  self: { label: "Amogh's own memory", note: 'Told by Amogh, in his own words.' },
  github: { label: `${PROFILES.github.label}: ${PROFILES.github.handle}`, href: PROFILES.github.href },
  secant: { label: `Secant, live site: ${LIVE.secant.label}`, href: LIVE.secant.href },
  hazen: { label: `Hazen Lights, live site: ${LIVE.hazen.label}`, href: LIVE.hazen.href },
  vera: { label: `Vera Enterprises: ${LIVE.vera.label}`, href: LIVE.vera.href },
  truecommit: { label: `TrueCommit, live: ${LIVE.truecommit.label}`, href: LIVE.truecommit.href },
  throttle: { label: `Throttle, live: ${LIVE.throttle.label}`, href: LIVE.throttle.href },
} satisfies Record<string, Citation>;

export type CitationId = keyof typeof CITATIONS;

export type Section = { id: string; title: string; body: string[] };

export const ARTICLE = {
  title: 'Amogh P',
  subtitle: 'From Amoghpedia, the free encyclopedia nobody asked for',
  tabs: { label: 'Article views', article: 'Article', talk: 'Talk' },
  /** Where "Talk" leads: the AI twin. */
  tabLinks: { talk: 'ask' } satisfies Record<string, PageId>,
  // TODO(Amogh): approve or cut the joke lines - this banner, the {cn} in Personal life, the footer.
  banner: {
    title: 'This article has multiple issues.',
    body: 'The subject keeps shipping new projects faster than anyone can document them.',
  },
  contents: 'Contents',
  references: 'References',
  source: 'Source',
  seeAlso: 'See also',
  citationNeeded: 'citation needed',
  citationNeededNote: 'Our editors are still looking into this one.',
  lastEdited: 'This page was last edited on 2 November 2026 by Amogh, out loud.',
  lead: [
    '**Amogh P** (Amogh Prashanth) is a full-stack and systems engineer from Bengaluru, India, who builds software that holds when something breaks.{ref:self} He studies Data Science at RV University, works as a Software Developer at Vera, and freelances in a two-person team with a friend.{ref:self} He held seven roles before graduating and has finished in the top 10 at multiple national-level hackathons.{ref:self}',
  ],
  sections: [
    {
      id: 'early-life',
      title: 'Early life and education',
      body: [
        'Amogh chose a B.Sc. over an engineering degree because he wanted the freedom to explore.{ref:self} He had always loved coding, but not only the code: he wanted to try everything, see how software could improve things, and make life easier for himself and for other people.',
        'He began a B.Sc. (Hons) in Data Science at RV University, Bengaluru, in 2023, and is due to finish in 2027.{ref:self}',
      ],
    },
    {
      id: 'into-the-field',
      title: 'Going into the field',
      body: [
        'After his first year the curriculum thinned out. Rather than wait for it to pick up, Amogh took things into his own hands and went into the field early: to build real things, use his skills, and learn how industries actually work.{ref:self} The whole arc is told in [[story|The Story]].',
        'Before graduating he worked in seven roles, including internships in automation at Gojeta, app development and YOLOv5 research at RV University, web at ChaturManas, AI at Internshub and data at MasterCom.{ref:self}',
      ],
    },
    {
      id: 'campus',
      title: 'Campus life',
      body: [
        'At RV University Amogh hosted events and started his own biking club.{ref:self}',
        'Running clubs and events showed him how messy club and event management was, so he built an app for it: a role-based club management app in FlutterFlow and Firebase for students, club heads, reps and deans, with event discovery, QR-code registration, club joining, external event requests, real-time approvals and attendance analytics.{ref:self} The project stopped only when the funding ran out.{ref:self}',
        'It is a pattern with him: he gets involved, brings people in, and fixes what is broken in the things he is part of.',
      ],
    },
    {
      id: 'freelance',
      title: 'Freelance career',
      body: [
        'With one friend, Amogh started building websites, which he expected to be an easy market to enter. It was not. For the first **six months** the two of them did not land a single client.{ref:self}',
        'Their first client was Secant, an architecture firm, for whom they built a 3D interactive website.{ref:secant} That led to Hazen Lights, an architectural lighting company. Refusing to ship generic "AI slop", the team built it custom 3D models and a one-of-a-kind site.{ref:hazen}',
        'Work for a wedding business followed: a site for IIWM, a wedding business school, and another for Bogen Villa, its venue. The team also lost a few clients along the way.{ref:self} Each project is written up in [[work|Client Work]].',
      ],
    },
    {
      id: 'systems',
      title: 'The pivot to systems',
      body: [
        'The goal was never only websites. While working with one client, Amogh talked to people inside the company and found a director struggling to see the details across the several companies he ran.{ref:self}',
        'He pitched and built **Vera ERP**: one place for every company in the group, covering HR, sales and quotations, projects, purchase, logistics, Tally finances and documents, with a private AI assistant that runs on the company\'s own server, so its data never leaves it.{ref:vera} It runs ERPNext v15 and Frappe HRMS headless behind a React and TypeScript front end, on bare-metal Ubuntu behind nginx and a Cloudflare Tunnel.{ref:self} It is live, and serves about 41 employees across the companies.{ref:self}',
        'Another client, who sells his own ERP to companies that have no HR department, wanted a separate HR module linked into it without passing credentials over APIs. Amogh\'s team built and delivered it: an Indian HR suite covering payroll, leave, hiring, performance and income tax, including Form 16.{ref:self}',
      ],
    },
    {
      id: 'side-projects',
      title: 'Side projects',
      body: [
        'Amogh builds small projects constantly: to learn, to solve his own problems, or for fun. They live in [[side-builds|Side Builds]].{ref:github}',
        '- **TrueCommit**: a bounded autonomous revenue-recovery agent, in which "the LLM sees and speaks but never spends". It collected ₹2,15,867 across five real Razorpay invoices, all paid.{ref:truecommit}',
        '- **Throttle**: a production email scheduler that loses nothing across restarts, with a circuit breaker proven in a real SMTP outage.{ref:throttle}',
        '- **Avika**: a free offline Android app for Bengaluru parents of children with disabilities. No account, no ads, no analytics.{ref:self}',
        '- **CropRadar**: a Telegram bot that gives farmers crop-disease risk and diagnoses leaf photos in English and Kannada.{ref:self}',
        '- **Trading Strategy Engine** and **LeadScope**, an ethical B2B prospect research dashboard.{ref:self}',
      ],
    },
    {
      id: 'hackathons',
      title: 'Hackathons',
      body: [
        'Amogh has finished in the top 10 at multiple national-level hackathons.{ref:self} At the Razorpay AI Buildathon 2026 (Track 03) he built TrueCommit.{ref:truecommit} An earlier, measured version, Promise Keeper, reached 88.6% promise extraction with 721 tests, and labelled honestly what was simulated and what was real.{ref:self}',
      ],
    },
    {
      id: 'personal-life',
      title: 'Personal life',
      body: [
        'Outside work Amogh 3D prints on a Bambu Lab P1S, runs his own home server, and has an idea for a SaaS product that he is working on.{ref:self} He speaks English, Kannada, Hindi, Telugu and Tamil. He reportedly sleeps.{cn}',
      ],
    },
    {
      id: 'philosophy',
      title: 'Philosophy',
      body: [
        'He does the work not only for clients but to understand industries in depth, find what he actually loves, and get better every day.{ref:self} In his words:',
        '> Build software that holds when something breaks.',
        "> Measure what can be measured, and label what can't.",
        "> I'd rather hear the honest result than a flattering one.",
        'You can put questions to his AI twin on [[ask|Ask Amogh]].',
      ],
    },
  ] satisfies Section[],
  seeAlsoPages: ['story', 'work', 'side-builds', 'shorts', 'ask'] satisfies PageId[],
};

export const INFOBOX = {
  caption: 'Amogh P, Bengaluru',
  /** His photo; without one, the monogram below. */
  photo: `${import.meta.env.BASE_URL}photo/amogh.webp` as string | undefined,
  monogram: 'AP',
  rows: [
    { label: 'Based in', value: 'Bengaluru, India' },
    { label: 'Education', value: 'B.Sc. (Hons) Data Science, RV University (2023–2027)' },
    { label: 'Occupation', value: 'Full-stack and systems engineer; Software Developer at Vera; freelancer' },
    { label: 'Languages', value: 'English, Kannada, Hindi, Telugu, Tamil' },
    { label: 'Known for', value: 'Vera ERP, TrueCommit (₹2,15,867 recovered), 3D client websites' },
    { label: 'Team size', value: '2 (him and a friend)' },
  ],
  links: [PROFILES.github, PROFILES.linkedin],
};
