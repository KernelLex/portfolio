/**
 * Voice Receipts: what Amogh said, and what got built from it.
 *
 * Every "spoken" text is copied exactly from the Claude Code session log, as
 * Wispr Flow typed it, typos and all ("Ibera" is Wispr hearing "Vera"). Times
 * are IST. Adding a receipt means adding an entry here, nothing else.
 */
export type ReceiptTool = 'Claude Code' | 'Emergent' | 'Prompt Lens';

export type Receipt = {
  id: string;
  /** ISO timestamp, from the session log. */
  at: string;
  tool: ReceiptTool;
  spoken: string;
  /** Set when only part of a long dictation is shown. */
  excerpt?: boolean;
  result: string;
  /** Commit hashes in the public repo. */
  commits?: readonly string[];
};

export const RECEIPTS_PAGE = {
  eyebrow: 'amogh://receipts',
  title: 'Voice Receipts',
  lead: 'Every prompt that built this site was spoken through Wispr Flow. Here are the receipts, exactly as Wispr typed them.',
  stats: { entries: 'Receipts', words: 'Words spoken', spoken: 'Prompts spoken', spokenValue: '100%' },
  said: 'Said',
  built: 'Built',
  excerpt: 'excerpt',
  all: 'All',
  commit: 'Commit',
  repo: 'https://github.com/KernelLex/portfolio',
  repoLabel: 'The whole history is public on GitHub',
} as const;

export const RECEIPTS: ReadonlyArray<Receipt> = [
  {
    id: 'kickoff',
    at: '2026-10-31T19:15:00+05:30',
    tool: 'Claude Code',
    spoken:
      "Okay, this is the project I'm going to do. I'm going to drop the Claude MD file to you, so just understand the project. Don't do anything. I'll drop task one. Ask me what you need, and then, if you have any doubts, ask me. Let's plan, and then let's start developing. Do not start anything until I drop you Task 1 file. Just understand what needs to be done.",
    result: 'Read the brief, asked questions, planned. No code yet, as asked.',
  },
  {
    id: 'task-1',
    at: '2026-10-31T19:18:00+05:30',
    tool: 'Claude Code',
    spoken:
      "https://github.com/KernelLex/portfolio THIS IS THE REPO this is the GitHub I want you to push everything to. I do have an Emergent account. I am on Chrome. And I use Opera GX. Yes, I want to see the live build. That I will do at the end. Start building the video first. And I'll drop you a task right now. Again, ask me what you need for task one. I will provide it. Let's start building. Let's go.",
    result: 'The first version: a pixel side-scroller through a neon street, a shop door, a boot screen and a placeholder browser.',
    commits: ['3f779ac'],
  },
  {
    id: 'proper-game',
    at: '2026-10-31T21:04:00+05:30',
    tool: 'Claude Code',
    spoken:
      "Okay, now let's just focus on task one first and modify it to perfection. How do I improve the quality of the intro? It should look like a proper game. The idea is nice, but I want it to look like a proper, proper game with nice quality pixels and everything.",
    result: 'Rebuilt the art pipeline: procedurally generated pixel art, lit neon, rain and parallax.',
    commits: ['dfd2f2f'],
  },
  {
    id: 'movement',
    at: '2026-10-31T21:24:00+05:30',
    tool: 'Claude Code',
    spoken:
      'Okay, much better, but we still need to improve a lot on the character movement and all that stuff, the smoothness of it, and the full-screen version of it. Is there any way we could get an asset prebuilt like this already, which we can use and which looks way cooler and way better than this? Or is there any way we can improve it, or you can improve it?',
    result: 'Smooth movement: a stride-locked walk cycle, weighted acceleration and a stable camera.',
    commits: ['a34c50b'],
  },
  {
    id: 'cafe',
    at: '2026-11-01T18:15:00+05:30',
    tool: 'Claude Code',
    spoken:
      "See, this thing I wanted is that it goes into a cafe, like a computer cafe. You sit at the computer, then you start the computer, and my browser opens with the intro. That is how I wanted it to be.\n\nWhen you go into a building with a computer, when the computer opens, you use it as a normal computer. Then you click the browser, and my thing goes: a website appears. That's how I want the intro to be.\n\nChange it and make the animation look better, even better, like a proper game. It should be high, nice, and playable. Also, make the billboard better.",
    result: 'The cyber cafe: walk in, sit at seat 3, boot the PC, use its desktop and open the browser yourself.',
    commits: ['445640a'],
  },
  {
    id: 'city',
    at: '2026-11-01T22:23:00+05:30',
    tool: 'Claude Code',
    spoken:
      "okay, for now, could you stop the thing which moves on its own? Try to make it look very, very good and very, very realistic. Make the billboards proper, where all the text is, like proper billboards on buildings. Try to enhance the graphics more. It should look like a proper 2D game. Even the cafe: remove the ₹30 sign. Don't add the price of the cyber cafe, and one main thing I wanted to add is and add more cars, add more futuristic cars, and make more buildings, and make it better, like a whole cyberpunk city. And when you are going to connect to the laptop, it's a futuristic city. I want to add a cyberpunk game animation. It's not a basic complete animation. It's like in a cyberpunk game, they connect their personal link physical hard drive from their body to the laptop. I want that animation, but in an Among Us-style imposter, like that red screen coming, like how it would come in a 2D game.",
    excerpt: true,
    result: 'A whole cyberpunk city: mounted billboards, flying traffic, more buildings, and the red-alarm jack-in with a cable from the wrist.',
    commits: ['e274afd'],
  },
  {
    id: 'log-off',
    at: '2026-11-01T23:42:00+05:30',
    tool: 'Claude Code',
    spoken:
      'when I log out of the PC, I should still be in the cafe, and I should be able to go out. Make that part. Make the quality of all the billboards, like Wispr Flow, like an animation moving, and make the Wispr Flow billboard nicer and more visible. It\'s a little blurry. Also, when you\'re in the city, there\'s a mic option. I want a nice cyberpunk-themed song to be playing, something similar to that, like a night future city. And also make the cafe look futuristic.',
    excerpt: true,
    result: 'Log off back into the cafe and walk out, an animated Wispr Flow billboard, city music, a futuristic cafe, a longer jack-in.',
    commits: ['72be0f8'],
  },
  {
    id: 'character',
    at: '2026-11-02T00:20:00+05:30',
    tool: 'Claude Code',
    spoken:
      'okay, in the animation, make the hand better in the jacking-in animation, and see how you can improve it more. Improve the people on the website. The people moving around should be different, and they should not be overlapping me. And also improve my character design. When you enter into the cyber cafe, the entering animation is nice. The way I exit is not nice.',
    excerpt: true,
    result: 'A cyberpunk player character, a real hand in the jack-in, varied people who stop short of you, doors that work both ways.',
    commits: ['074e284'],
  },
  {
    id: 'freeze',
    at: '2026-11-02T13:13:00+05:30',
    tool: 'Claude Code',
    spoken:
      "The website is lagging after some time. Check what's happening. And see how you can optimize it and improve more graphics of it. Make it look very good and improve it however you can.",
    result: 'Found and fixed a freeze: one auto-rickshaw started on an animation frame it did not have, which stopped the game loop.',
    commits: ['5a2484a'],
  },
  {
    id: 'browser',
    at: '2026-11-02T22:07:00+05:30',
    tool: 'Claude Code',
    spoken: "read this file. These are all the next steps you need to do. Ask if you have any questions or if you need any other files, and let me know. Let's move to the next part.",
    result: 'The real browser: tabs with history, the voice address bar, the starfield, the pixel guide, and a phone layout.',
    commits: ['20f0b25'],
  },
  {
    id: 'stage',
    at: '2026-11-02T22:58:00+05:30',
    tool: 'Claude Code',
    spoken:
      'what shoul i do let me know properly\n\nhttps://secant.in\nhttps://hazenlights.com\nhttps://veraenterprises.in\nthe live links which u add\ngit hub https://github.com/KernelLex\nhttps://www.linkedin.com/in/amogh-prashanth-393b37319/ and contine to TASK-03 and 4 make it happen see, the main thing is to improve the UI of the browser on the laptop and make the laptop screen look a little more futuristic.',
    excerpt: true,
    result: 'The kinetic lyric stage on New Tab, Amoghpedia, and a more futuristic browser chrome.',
    commits: ['edb3767'],
  },
  {
    id: 'everything',
    at: '2026-11-02T23:27:00+05:30',
    tool: 'Claude Code',
    spoken:
      "see, I'm talking about the terminal and everything else. When you're inside the laptop, the Linux OS kernel makes that, and the browser is also a little futuristic and a nice thing, like Opera. It should be cooler. Basically, take inspiration from opera and, if possible, add a nice live background to it. And the Wispr Flow voice: as I'm speaking, it should show it on the screen, not once I'm completed. See if that is possible. And do task 5. And task 6 complete all the remaining tasks",
    excerpt: true,
    result: 'The Story, Client Work with live sites inside Navigator, Prompt Lens, Ask Amogh and its backend, and these receipts.',
    commits: ['0e90a74', 'c327b83'],
  },
  {
    id: 'jack-out',
    at: '2026-11-03T00:05:00+05:30',
    tool: 'Claude Code',
    spoken:
      'okay, now what is left to do? What are the things I need to do now, and what are the things that need to be done to publish this? Also, when you plug in the PC, you get an animation, right? I also want the same animation when you plug out (top opposite animation). Could you do that also?',
    result: 'The jack-out: logging off plays the jack-in in reverse. The sync drains, the plug pops, the cable whips back into the wrist, LINK CLOSED, and the bars open on the cafe.',
  },
];
