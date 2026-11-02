/**
 * The visitor's name, if they said it on the title screen. Byte greets them
 * with it and the lyric stage performs it. Memory only: a reload starts over.
 */
let name = '';

// "My name is Priya." is a sentence; the name is the last part of it.
const LEAD_IN = /^(?:(?:hi|hello|hey)[\s,!.]*)?(?:my name is|my name's|i am|i'm|im|this is|it's|its|call me)\s+/i;
const MAX = 18;

/** The name in what was said or typed: no lead-in, no trailing punctuation. */
export function cleanName(said: string): string {
  return said.trim().replace(LEAD_IN, '').replace(/[.!?,;:]+$/, '').replace(/\s+/g, ' ').slice(0, MAX).trim();
}

export const playerName = (): string => name;

export function setPlayerName(value: string): void {
  name = cleanName(value);
}
