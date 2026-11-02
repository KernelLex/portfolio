import type { PageId } from './pages';

/** Ask Amogh: the AI twin. Clearly labelled as AI (CLAUDE.md 10). */
export const ASK = {
  eyebrow: 'amogh://ask',
  title: 'Ask Amogh',
  badge: 'AI twin',
  label: 'AI twin, not the real Amogh. Answers come from what he told it.',
  greeting: "Hey, I'm Amogh's AI twin. Ask me about my work, my story, or how this site was built.",
  starters: [
    'Why B.Sc. instead of engineering?',
    'What was the hardest part?',
    'Tell me about Vera ERP',
    'Why Wispr Flow?',
    'What did you learn from 6 months of zero clients?',
  ],
  placeholder: 'Ask me anything',
  inputLabel: 'Your question for the AI twin',
  send: 'Send',
  thinking: 'Thinking',
  offline: 'Offline mode: answers from a short FAQ. The full AI twin runs when the backend is deployed.',
  openTab: (title: string) => `Open ${title}`,
  readAloud: 'Read aloud',
  stopReading: 'Stop reading',
  clear: 'Clear chat',
  you: 'You',
  twin: 'AI twin',
} as const;

type Faq = { keywords: readonly string[]; answer: string; tab?: PageId };

/**
 * Offline answers, in Amogh's voice, from content/life-story.md only. Where the
 * life story has a gap, the answer says so rather than filling it.
 */
export const FAQ: ReadonlyArray<Faq> = [
  {
    keywords: ['bsc', 'b.sc', 'engineering', 'degree', 'college', 'university', 'study', 'studies'],
    answer:
      "I picked a B.Sc. because I wanted freedom to explore. I love coding, but not just the code: I wanted to try everything and see how software can make life easier. After year one the curriculum thinned out, so I stopped waiting and went into the field early.",
    tab: 'story',
  },
  {
    keywords: ['hardest', 'zero clients', 'six months', '6 months', 'struggle', 'difficult', 'learn', 'lesson', 'tough'],
    answer:
      "Six months of zero clients. A friend and I started with websites because it looked like an easy market. It wasn't. We kept pitching until Secant said yes, and that led to Hazen Lights. What exactly kept me going is something the real Amogh can tell you better than I can.",
    tab: 'story',
  },
  {
    keywords: ['vera', 'erp', 'director', 'companies'],
    answer:
      "Vera ERP started when I found a director struggling to see across the several companies he runs. We built one system for all of them: HR, sales and quotations, projects, purchase, logistics, Tally finances and documents, plus a private AI that runs on their own server, so the data never leaves it. It's in its main testing phase.",
    tab: 'work',
  },
  {
    keywords: ['hrms', 'hr ', 'payroll', 'form 16', 'credentials'],
    answer:
      "A client sells his own ERP to companies without HR, and wanted an HR module linked into it without sending credentials over APIs. We built it: payroll, leave, hiring, performance, income tax including Form 16, and it works with his ERP both ways.",
    tab: 'work',
  },
  {
    keywords: ['nova', 'crm', 'product', 'products', 'thushaar'],
    answer:
      "Nova is the product line I build with Thushaar Rangan: an ERP, a CRM and an HRMS, all built and running. Each one began as a request from one company. The walkthrough videos are in Client Work.",
    tab: 'work',
  },
  {
    keywords: ['secant', 'hazen', 'website', 'websites', '3d', 'wedding', 'iiwm', 'bogen', 'clients', 'client'],
    answer:
      "Secant, an architecture firm, was our first client: a 3D interactive site. That led to Hazen Lights, where I refused to make generic AI-slop sites and built custom 3D. Then a wedding business: IIWM and its venue, Bogen Villa. We lost a few clients along the way too.",
    tab: 'work',
  },
  {
    keywords: ['wispr', 'voice', 'dictate', 'dictation', 'speak', 'speaking'],
    answer:
      "I built this whole site by voice: every prompt was dictated through Wispr Flow. Why Wispr, in my own words? That part isn't in my memory yet, so ask the real Amogh.",
  },
  {
    keywords: ['built this', 'this site', 'stack', 'how was', 'portfolio', 'navigator'],
    answer:
      "This site is a browser I made up, Amogh Navigator: React and TypeScript, Phaser for the city outside, three.js for the stars, GSAP for motion. I dictated it to Claude Code through Wispr Flow, and the whole history is public on GitHub.",
  },
  {
    keywords: ['truecommit', 'razorpay', 'hackathon', 'hackathons', 'buildathon'],
    answer:
      "TrueCommit was my Razorpay AI Buildathon 2026 build: a revenue-recovery agent where the LLM sees and speaks but never spends. It collected ₹2,15,867 across five real Razorpay invoices, all paid. I've been top 10 at multiple national-level hackathons.",
    tab: 'side-builds',
  },
  {
    keywords: ['side', 'projects', 'throttle', 'avika', 'cropradar', 'leadscope', 'trading engine', 'fun', 'metakai', 'cyberbane', 'fitness', 'cyberpunk', 'mod'],
    answer:
      "I build small things constantly: Throttle, an email scheduler that loses nothing across restarts; Avika, a free offline app for Bengaluru parents of children with disabilities; CropRadar, a crop-disease bot in English and Kannada; and, with Thushaar Rangan, Metakai, a fitness app that keeps your data on your phone, and CyberBane, a reputation overhaul for Cyberpunk 2077; a trading strategy engine; and LeadScope.",
    tab: 'side-builds',
  },
  {
    keywords: ['language', 'languages', 'kannada', 'hindi', 'telugu', 'tamil'],
    answer: 'English, Kannada, Hindi, Telugu and Tamil. Try the lyric stage on the home page in Hindi or Kannada.',
    tab: 'amoghpedia',
  },
  {
    keywords: ['hobby', 'hobbies', 'free time', '3d print', 'printing', 'bambu', 'home server', 'saas', 'startup', 'side business'],
    answer:
      "I 3D print on a Bambu Lab P1S, run my own home server, and I have an idea for a SaaS product that I'm working on.",
    tab: 'amoghpedia',
  },
  {
    keywords: ['club', 'clubs', 'biking', 'bike', 'event', 'events', 'campus', 'outreach', 'marketing'],
    answer:
      "At RV University I hosted events and started my own biking club. Running them showed me how messy club and event management was, so I built an app for it: events, QR registrations, approvals and attendance. It stopped when the funding did. That's how I work: I get into things, bring people in, and fix what's broken.",
    tab: 'story',
  },
  {
    keywords: ['contact', 'hire', 'linkedin', 'github', 'email', 'reach'],
    answer: "Best way to reach the real me is LinkedIn (linkedin.com/in/amogh-prashanth-393b37319). My code is on GitHub as KernelLex. I'm open to full-time and freelance work.",
  },
  {
    keywords: ['are you real', 'are you ai', 'who are you', 'bot', 'human'],
    answer: "I'm an AI twin, not the real Amogh. I only know what he wrote down for me, and I'll say so when something isn't in there.",
  },
];

export const FAQ_UNKNOWN = "That's not in my memory. Ask the real Amogh on LinkedIn.";
