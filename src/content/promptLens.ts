/** Prompt Lens: speak a messy idea, get a structured prompt (CLAUDE.md 6.5). */
export type LensMode = 'coding' | 'research' | 'writing' | 'image' | 'general';

export const LENS = {
  eyebrow: 'amogh://prompt-lens',
  title: 'Prompt Lens',
  lead: 'Ramble an idea out loud. Get back a prompt an AI can actually work with.',
  pipeline: ['Raw speech', 'Wispr clean', 'Engineered prompt'],
  modesLabel: 'Mode',
  modes: [
    { id: 'coding', label: 'Coding' },
    { id: 'research', label: 'Research' },
    { id: 'writing', label: 'Writing' },
    { id: 'image', label: 'Image' },
    { id: 'general', label: 'General' },
  ] satisfies { id: LensMode; label: string }[],
  raw: {
    title: 'Live speech (raw)',
    start: 'Start live view',
    stop: 'Stop',
    empty: 'Press start and talk: every word as it is heard, fillers and all.',
    note: "Your browser's speech recognition (Chrome or Edge; in Chrome, Google processes the audio). Nothing is recorded or stored here.",
    unsupported: 'This browser has no live speech recognition. Chrome or Edge do.',
    use: 'Use this text',
  },
  clean: {
    title: 'Wispr Flow (clean)',
    placeholder: 'Hold your Wispr key and ramble about what you want an AI to do…',
    label: 'Your idea, as Wispr typed it (or type it yourself)',
  },
  output: {
    title: 'Engineered prompt',
    empty: 'Your structured prompt appears here.',
    before: 'Before',
    after: 'After',
    copy: 'Copy',
    copied: 'Copied',
    chatgpt: 'Open in ChatGPT',
    claude: 'Open in Claude',
  },
  enhance: 'Enhance',
  working: 'Engineering…',
  offline: 'Offline mode: a rule-based template, not an AI. The real Prompt Lens runs when the backend is deployed.',
  footer: 'Built by Amogh because raw speech makes messy prompts, and this whole site was built from spoken prompts.',
  receipts: 'See the receipts',
} as const;

/** The offline template, used when there is no backend. Plain rules, clearly labelled. */
export const TEMPLATE: Record<LensMode, { role: string; constraints: string[]; format: string; question: string }> = {
  coding: {
    role: 'You are a senior software engineer who writes clear, tested, production-ready code.',
    constraints: ['Ask before assuming a framework, language version or library.', 'Explain trade-offs briefly.', 'Handle errors and edge cases.'],
    format: 'Working code in fenced blocks, then a short explanation of how it works and how to run it.',
    question: 'Which language, framework and environment should this run in?',
  },
  research: {
    role: 'You are a careful research analyst who separates facts from guesses and cites sources.',
    constraints: ['Cite a source for every factual claim.', 'Say clearly when something is uncertain or disputed.', 'Prefer recent, primary sources.'],
    format: 'A short summary, then key findings as bullet points with sources, then open questions.',
    question: 'How deep should this go, and is there a time period or region to focus on?',
  },
  writing: {
    role: 'You are an experienced editor who writes clearly and keeps the author’s voice.',
    constraints: ['Keep my meaning; do not add claims I did not make.', 'Plain language, short sentences.', 'Match the tone to the audience.'],
    format: 'The finished text, ready to use, followed by one line on what you changed.',
    question: 'Who is the audience, and how long should it be?',
  },
  image: {
    role: 'You are an art director writing a precise prompt for an image model.',
    constraints: ['Describe subject, setting, lighting, composition and style.', 'Avoid text in the image unless asked.', 'One coherent scene.'],
    format: 'One image prompt as a single paragraph, then a short negative prompt.',
    question: 'What style, aspect ratio and mood are you after?',
  },
  general: {
    role: 'You are a thoughtful, practical assistant.',
    constraints: ['Be specific and concrete.', 'Ask if anything important is missing.', 'Keep it concise.'],
    format: 'A clear, well-structured answer with headings or bullets where they help.',
    question: 'What does a great result look like for you?',
  },
};

export const FILLER_WORDS = ['um', 'umm', 'uh', 'uhh', 'like', 'you know', 'basically', 'actually', 'kind of', 'sort of', 'i mean', 'so yeah', 'right'];
