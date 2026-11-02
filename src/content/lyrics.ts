/** The kinetic lyric stage on New Tab: its demo line, its words, and its moods. */
export const LYRICS = {
  demo: 'Six months. Zero clients. Then everything changed.',
  /** The first line, for a visitor who said their name on the title screen. */
  welcome: (name: string) => `Welcome to my internet, ${name}!`,
  label: 'Lyric stage',
  demoTag: 'Demo',
  visitorTag: 'Your words',
  prompt: 'Click here, then hold your Wispr key and speak',
  placeholder: 'Hold your Wispr key and talk, or type and press Enter',
  inputLabel: 'Say or type something for the lyric stage to perform',
  perform: 'Perform',
  replay: 'Replay',
  languages: 'Try it in Hindi or Kannada too.',
  live: {
    off: 'Live words',
    on: 'Live words on',
    language: 'Speech language',
    tag: 'Live · raw speech',
    note: "Shows your words as you speak, with your browser's speech recognition (in Chrome, Google processes the audio). Wispr's clean text takes over when it lands. Nothing is recorded or stored here.",
    unsupported: 'Live words need a browser with speech recognition, like Chrome or Edge.',
  },
} as const;

export type Mood = 'neutral' | 'bright' | 'low' | 'calm';

/** A phrase containing one of these words tints the stage. Checked in this order. */
export const MOOD_WORDS: Record<Exclude<Mood, 'neutral'>, readonly string[]> = {
  bright: ['love', 'happy', 'great', 'amazing', 'awesome', 'excited', 'yes', 'wow', 'win', 'won', 'best', 'changed', 'finally', 'incredible', 'fun', 'yay', 'proud', 'shipped'],
  low: ['sad', 'zero', 'lost', 'fail', 'failed', 'hard', 'alone', 'tired', 'miss', 'sorry', 'broke', 'never', 'nothing', 'stuck'],
  calm: ['calm', 'space', 'quiet', 'peace', 'slow', 'breathe', 'sleep', 'dream', 'night', 'stars', 'soft', 'gentle', 'home'],
};
