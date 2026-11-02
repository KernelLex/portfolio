/** The kinetic lyric stage on New Tab: its demo line, its words, and its moods. */
export const LYRICS = {
  demo: 'Six months. Zero clients. Then everything changed.',
  label: 'Lyric stage',
  demoTag: 'Demo',
  visitorTag: 'Your words',
  prompt: 'Click here, then hold your Wispr key and speak',
  placeholder: 'Hold your Wispr key and talk, or type and press Enter',
  inputLabel: 'Say or type something for the lyric stage to perform',
  perform: 'Perform',
  replay: 'Replay',
  hearing: 'Hearing',
  languages: 'Try it in Hindi or Kannada too.',
} as const;

export type Mood = 'neutral' | 'bright' | 'low' | 'calm';

/** A phrase containing one of these words tints the stage. Checked in this order. */
export const MOOD_WORDS: Record<Exclude<Mood, 'neutral'>, readonly string[]> = {
  bright: ['love', 'happy', 'great', 'amazing', 'awesome', 'excited', 'yes', 'wow', 'win', 'won', 'best', 'changed', 'finally', 'incredible', 'fun', 'yay', 'proud', 'shipped'],
  low: ['sad', 'zero', 'lost', 'fail', 'failed', 'hard', 'alone', 'tired', 'miss', 'sorry', 'broke', 'never', 'nothing', 'stuck'],
  calm: ['calm', 'space', 'quiet', 'peace', 'slow', 'breathe', 'sleep', 'dream', 'night', 'stars', 'soft', 'gentle', 'home'],
};
