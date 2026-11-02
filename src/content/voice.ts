/** Words around voice input, shared by every Wispr-ready field on the site. */
export const VOICE = {
  hint: 'Hold your Wispr key and talk',
  detected: 'Voice input detected',
  wpm: (n: number) => `~${n} WPM`,
  /** The comparison the WPM meter is measured against. */
  typingAverage: 'typing avg ~40',
  estimated: 'estimated from how the text arrived',
  status: {
    ready: 'Wispr ready',
    heard: 'Voice',
  },
} as const;

export const MIC = {
  start: 'Use my mic',
  stop: 'Stop',
  listening: 'Listening…',
  unsupported: 'Your browser has no speech recognition. Chrome or Edge do.',
  denied: 'Microphone access was blocked.',
  failed: 'Speech recognition stopped. Try again.',
  language: 'Speech language',
  /** Honest about where audio goes: in Chrome, the browser's recogniser sends it to Google. */
  note: "Uses your browser's speech recognition (in Chrome, Google processes the audio). This site never records or stores it.",
} as const;

export const SPEECH_LANGUAGES = [
  { code: 'en-IN', label: 'English' },
  { code: 'hi-IN', label: 'हिन्दी' },
  { code: 'kn-IN', label: 'ಕನ್ನಡ' },
] as const;

export type SpeechLanguage = (typeof SPEECH_LANGUAGES)[number]['code'];
