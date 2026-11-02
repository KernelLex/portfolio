import { FILLER_WORDS, TEMPLATE, type LensMode } from '../../content/promptLens';

const FILLERS = new RegExp(`\\b(?:${FILLER_WORDS.map((w) => w.replace(/ /g, '\\s+')).join('|')})\\b,?\\s*`, 'gi');

/**
 * Prompt Lens without a model: strip the fillers, take the first sentence as
 * the task and the rest as context, and wrap it in the mode's template.
 * Shown as "offline mode" so nobody mistakes it for the AI.
 */
export function offlinePrompt(text: string, mode: LensMode): string {
  const cleaned = text
    .replace(FILLERS, '')
    .replace(/^(?:so|okay|ok|and)\b,?\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);
  const task = sentences[0] ?? cleaned;
  const context = sentences.slice(1).join(' ');
  const t = TEMPLATE[mode];
  const vague = cleaned.split(' ').length < 14;

  return [
    '## Role',
    t.role,
    '',
    '## Context',
    context || `In my own words: ${cleaned}`,
    '',
    '## Task',
    task,
    '',
    '## Constraints',
    ...t.constraints.map((c) => `- ${c}`),
    '',
    '## Output format',
    t.format,
    ...(vague ? ['', '## Clarifying questions', `- ${t.question}`] : []),
  ].join('\n');
}
