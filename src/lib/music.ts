import { audioContext, isSoundOn, subscribeSound } from './sound';

/**
 * The city at night, as music: an original synthwave loop played live by
 * WebAudio - no files, nothing licensed. Slow pads, a sixteenth-note arpeggio
 * through a dotted-eighth delay, pulsing octave bass, a drum machine, a lead
 * line on every other pass, and rain underneath.
 *
 * Silent until the visitor turns sound on. Inside the cafe it is heard through
 * the walls: low-passed and quieter. It stops when they jack in, and the PC
 * plays its own calm piece: the same key, no drums, a slow bell over pads.
 * Whenever something else is making sound - a video with its sound on, a
 * reply read aloud, the microphone listening - the music steps aside.
 */
export type MusicPlace = 'street' | 'cafe' | 'pc' | null;

const BPM = 92;
const STEP = 60 / BPM / 4; // a sixteenth
const LOOP_STEPS = 128; // eight bars

/** i - VI - III - VII in A minor, two bars each. */
const CHORDS = [
  [57, 60, 64],
  [53, 57, 60],
  [60, 64, 67],
  [55, 59, 62],
];

/** The lead, over bars 4-7: [bar, sixteenth, midi note, length in sixteenths]. */
const LEAD: ReadonlyArray<[number, number, number, number]> = [
  [4, 0, 76, 4],
  [4, 6, 74, 2],
  [4, 8, 72, 4],
  [4, 14, 69, 2],
  [5, 0, 67, 4],
  [5, 4, 69, 4],
  [5, 8, 72, 4],
  [5, 12, 74, 4],
  [6, 0, 76, 3],
  [6, 4, 79, 2],
  [6, 6, 76, 2],
  [6, 10, 74, 2],
  [6, 12, 72, 4],
  [7, 0, 74, 6],
  [7, 8, 72, 4],
  [7, 12, 69, 4],
];

/** The PC's chords: the city's, with sevenths, an octave lower and slower to change. */
const PC_CHORDS = [
  [45, 57, 60, 64, 67],
  [41, 57, 60, 64, 65],
  [48, 55, 59, 64, 67],
  [43, 55, 59, 62, 65],
];

/** The PC's bell, per four bars: [sixteenth, chord tone]. */
const BELL: ReadonlyArray<[number, number]> = [
  [0, 4],
  [6, 3],
  [12, 2],
  [24, 3],
  [32, 1],
  [40, 2],
  [44, 4],
  [56, 3],
];

const MIX: Record<'street' | 'cafe' | 'pc', { volume: number; cutoff: number; rain: number }> = {
  street: { volume: 0.22, cutoff: 16000, rain: 0.05 },
  cafe: { volume: 0.14, cutoff: 850, rain: 0.006 },
  pc: { volume: 0.16, cutoff: 3200, rain: 0 },
};

/** How often to check whether something else has started making sound. */
const LISTEN_EVERY = 10;

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

type Graph = {
  ctx: AudioContext;
  out: GainNode;
  tone: BiquadFilterNode;
  dry: GainNode;
  delayIn: GainNode;
  verbIn: GainNode;
  rain: GainNode;
  rainSource: AudioBufferSourceNode;
  noise: AudioBuffer;
};

let graph: Graph | null = null;
let place: MusicPlace = null;
let timer = 0;
let step = 0;
let loop = 0;
let next = 0;
let ticks = 0;
let hushed = false;
const holds = new Set<string>();

function impulse(ctx: AudioContext, seconds: number, decay: number): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
  }
  return buf;
}

function build(ctx: AudioContext): Graph {
  const out = ctx.createGain();
  out.gain.value = 0;
  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 16000;
  const comp = ctx.createDynamicsCompressor();
  out.connect(tone).connect(comp).connect(ctx.destination);

  const dry = ctx.createGain();
  dry.connect(out);

  const verbIn = ctx.createGain();
  const verb = ctx.createConvolver();
  verb.buffer = impulse(ctx, 2.8, 2.4);
  const verbOut = ctx.createGain();
  verbOut.gain.value = 0.45;
  verbIn.connect(verb).connect(verbOut).connect(out);

  // Dotted-eighth echo, feeding the reverb as well.
  const delayIn = ctx.createGain();
  const delay = ctx.createDelay(1);
  delay.delayTime.value = STEP * 3;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.36;
  const delayOut = ctx.createGain();
  delayOut.gain.value = 0.5;
  delayIn.connect(delay);
  delay.connect(feedback).connect(delay);
  delay.connect(delayOut).connect(dry);
  delay.connect(verbIn);

  const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const nd = noise.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

  // Rain: filtered noise, always running under the music.
  const rainSource = ctx.createBufferSource();
  rainSource.buffer = noise;
  rainSource.loop = true;
  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = 1800;
  band.Q.value = 0.6;
  const rain = ctx.createGain();
  rain.gain.value = 0;
  rainSource.connect(band).connect(rain).connect(out);
  rainSource.start();

  return { ctx, out, tone, dry, delayIn, verbIn, rain, rainSource, noise };
}

/* ------------------------------------------------------------ voices ---- */

function envelope(g: GainNode, t: number, peak: number, attack: number, release: number): void {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
}

function kick(g: Graph, t: number): void {
  const o = g.ctx.createOscillator();
  const v = g.ctx.createGain();
  o.frequency.setValueAtTime(130, t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
  envelope(v, t, 0.9, 0.005, 0.36);
  o.connect(v).connect(g.dry);
  o.start(t);
  o.stop(t + 0.42);
}

function noiseHit(g: Graph, t: number, highpass: number, peak: number, release: number, reverb: number): void {
  const src = g.ctx.createBufferSource();
  src.buffer = g.noise;
  const hp = g.ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = highpass;
  const v = g.ctx.createGain();
  envelope(v, t, peak, 0.002, release);
  src.connect(hp).connect(v).connect(g.dry);
  if (reverb > 0) {
    const send = g.ctx.createGain();
    send.gain.value = reverb;
    v.connect(send).connect(g.verbIn);
  }
  src.start(t, Math.random());
  src.stop(t + release + 0.05);
}

function snare(g: Graph, t: number): void {
  noiseHit(g, t, 1300, 0.4, 0.2, 0.7);
  const o = g.ctx.createOscillator();
  o.type = 'triangle';
  o.frequency.value = 185;
  const v = g.ctx.createGain();
  envelope(v, t, 0.22, 0.002, 0.12);
  o.connect(v).connect(g.dry);
  o.start(t);
  o.stop(t + 0.16);
}

function bass(g: Graph, t: number, midi: number): void {
  const o = g.ctx.createOscillator();
  o.type = 'sawtooth';
  o.frequency.value = hz(midi);
  const f = g.ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.Q.value = 4;
  f.frequency.setValueAtTime(900, t);
  f.frequency.exponentialRampToValueAtTime(240, t + 0.18);
  const v = g.ctx.createGain();
  envelope(v, t, 0.26, 0.004, STEP * 1.8);
  o.connect(f).connect(v).connect(g.dry);
  o.start(t);
  o.stop(t + STEP * 2);
}

function arp(g: Graph, t: number, midi: number, cutoff: number): void {
  const o = g.ctx.createOscillator();
  o.type = 'sawtooth';
  o.frequency.value = hz(midi);
  const f = g.ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.Q.value = 6;
  f.frequency.value = cutoff;
  const v = g.ctx.createGain();
  envelope(v, t, 0.06, 0.004, 0.15);
  o.connect(f).connect(v);
  v.connect(g.dry);
  const d = g.ctx.createGain();
  d.gain.value = 0.55;
  v.connect(d).connect(g.delayIn);
  const r = g.ctx.createGain();
  r.gain.value = 0.3;
  v.connect(r).connect(g.verbIn);
  o.start(t);
  o.stop(t + 0.22);
}

function pad(g: Graph, t: number, chord: ReadonlyArray<number>, length: number): void {
  for (const midi of [chord[0] - 12, ...chord]) {
    for (const cents of [-8, 8]) {
      const o = g.ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = hz(midi);
      o.detune.value = cents;
      const f = g.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 1300;
      const v = g.ctx.createGain();
      v.gain.setValueAtTime(0.0001, t);
      v.gain.exponentialRampToValueAtTime(0.022, t + 0.9);
      v.gain.setValueAtTime(0.022, t + length - 0.3);
      v.gain.exponentialRampToValueAtTime(0.0001, t + length + 0.6);
      o.connect(f).connect(v);
      v.connect(g.dry);
      const r = g.ctx.createGain();
      r.gain.value = 0.8;
      v.connect(r).connect(g.verbIn);
      o.start(t);
      o.stop(t + length + 0.7);
    }
  }
}

function lead(g: Graph, t: number, midi: number, length: number): void {
  const o = g.ctx.createOscillator();
  o.type = 'triangle';
  o.frequency.value = hz(midi);
  const vib = g.ctx.createOscillator();
  vib.frequency.value = 5.5;
  const depth = g.ctx.createGain();
  depth.gain.setValueAtTime(0, t);
  depth.gain.linearRampToValueAtTime(7, t + 0.2);
  vib.connect(depth).connect(o.detune);
  const v = g.ctx.createGain();
  v.gain.setValueAtTime(0.0001, t);
  v.gain.exponentialRampToValueAtTime(0.08, t + 0.02);
  v.gain.setValueAtTime(0.08, t + length * 0.8);
  v.gain.exponentialRampToValueAtTime(0.0001, t + length + 0.25);
  o.connect(v);
  v.connect(g.dry);
  const d = g.ctx.createGain();
  d.gain.value = 0.6;
  v.connect(d).connect(g.delayIn);
  const r = g.ctx.createGain();
  r.gain.value = 0.4;
  v.connect(r).connect(g.verbIn);
  o.start(t);
  vib.start(t);
  o.stop(t + length + 0.3);
  vib.stop(t + length + 0.3);
}

function bell(g: Graph, t: number, midi: number): void {
  for (const [ratio, peak] of [
    [1, 0.07],
    [2.01, 0.018],
  ] as const) {
    const o = g.ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = hz(midi) * ratio;
    const v = g.ctx.createGain();
    envelope(v, t, peak, 0.008, ratio === 1 ? 2.2 : 0.7);
    o.connect(v);
    v.connect(g.dry);
    const d = g.ctx.createGain();
    d.gain.value = 0.5;
    v.connect(d).connect(g.delayIn);
    const r = g.ctx.createGain();
    r.gain.value = 0.7;
    v.connect(r).connect(g.verbIn);
    o.start(t);
    o.stop(t + 2.4);
  }
}

function sub(g: Graph, t: number, midi: number, length: number): void {
  const o = g.ctx.createOscillator();
  o.type = 'sine';
  o.frequency.value = hz(midi);
  const v = g.ctx.createGain();
  v.gain.setValueAtTime(0.0001, t);
  v.gain.exponentialRampToValueAtTime(0.12, t + 1.4);
  v.gain.setValueAtTime(0.12, t + length - 0.8);
  v.gain.exponentialRampToValueAtTime(0.0001, t + length + 0.4);
  o.connect(v).connect(g.dry);
  o.start(t);
  o.stop(t + length + 0.5);
}

/* --------------------------------------------------------- sequencer ---- */

/** The PC: a chord every four bars, a bell line that shifts each pass, nothing that thumps. */
function playPcStep(g: Graph, s: number, t: number): void {
  const phrase = ((loop * LOOP_STEPS + s) / 64) | 0;
  const i = s % 64;
  const chord = PC_CHORDS[phrase % PC_CHORDS.length];
  if (i === 0) {
    pad(g, t, chord.slice(1), STEP * 64);
    sub(g, t, chord[0], STEP * 64);
  }
  for (const [at, tone] of BELL) {
    if (at === i) bell(g, t, chord[1 + ((tone + phrase) % 4)] + 12);
  }
}


function playStep(g: Graph, s: number, t: number): void {
  if (place === 'pc') {
    playPcStep(g, s, t);
    return;
  }
  const bar = (s / 16) | 0;
  const i = s % 16;
  const chord = CHORDS[(bar >> 1) % CHORDS.length];
  // The very first two bars are pads and arpeggio only - a way in.
  const intro = loop === 0 && bar < 2;

  if (!intro) {
    if (i % 8 === 0) kick(g, t);
    if (i === 4 || i === 12) snare(g, t);
    if (i % 2 === 0) noiseHit(g, t, 7000, i % 4 === 2 ? 0.06 : 0.035, 0.045, 0);
    if (i % 2 === 0) bass(g, t, chord[0] - 24 + (i % 4 === 2 ? 12 : 0));
  }
  const notes = [chord[0], chord[1], chord[2], chord[0] + 12];
  const cutoff = 900 + 800 * (0.5 + 0.5 * Math.sin((loop * LOOP_STEPS + s) / 24));
  arp(g, t, notes[i % 4] + 12, cutoff);
  if (s % 32 === 0) pad(g, t, chord, STEP * 32);
  if (loop % 2 === 1) {
    for (const [b, at, midi, len] of LEAD) if (b === bar && at === i) lead(g, t, midi, len * STEP);
  }
}

/** Is anything else on the page making sound? */
function otherAudio(): boolean {
  if (holds.size || window.speechSynthesis?.speaking) return true;
  for (const m of document.querySelectorAll('video, audio')) {
    const media = m as HTMLMediaElement;
    if (!media.paused && !media.ended && !media.muted && media.volume > 0) return true;
  }
  return false;
}

function tick(): void {
  const g = graph;
  if (!g) return;
  if (++ticks % LISTEN_EVERY === 0 && otherAudio() !== hushed) {
    hushed = !hushed;
    applyMix(false);
  }
  while (next < g.ctx.currentTime + 0.15) {
    playStep(g, step, next);
    next += STEP;
    step = (step + 1) % LOOP_STEPS;
    if (step === 0) loop += 1;
  }
}

function applyMix(fadeIn: boolean): void {
  if (!graph || !place) return;
  const m = MIX[place];
  const t = graph.ctx.currentTime;
  graph.out.gain.cancelScheduledValues(t);
  graph.out.gain.setTargetAtTime(hushed ? 0 : m.volume, t, hushed ? 0.15 : fadeIn ? 1.2 : 0.8);
  graph.tone.frequency.setTargetAtTime(m.cutoff, t, 0.4);
  graph.rain.gain.setTargetAtTime(m.rain, t, 0.6);
}

function start(): void {
  const ctx = audioContext();
  if (!ctx) return;
  graph = build(ctx);
  step = 0;
  loop = 0;
  next = ctx.currentTime + 0.1;
  hushed = otherAudio();
  applyMix(true);
  timer = window.setInterval(tick, 25);
}

function stop(): void {
  const g = graph;
  if (!g) return;
  graph = null;
  window.clearInterval(timer);
  g.out.gain.cancelScheduledValues(g.ctx.currentTime);
  g.out.gain.setTargetAtTime(0, g.ctx.currentTime, 0.3);
  window.setTimeout(() => {
    g.rainSource.stop();
    g.out.disconnect();
  }, 1500);
}

function sync(): void {
  const want = isSoundOn() && place !== null;
  if (want && !graph) start();
  else if (!want && graph) stop();
  else applyMix(false);
}

/** Where the player is: the street, inside the cafe, at the PC, or nowhere (silence). */
export function setMusicPlace(where: MusicPlace): void {
  place = where;
  sync();
}

/** Something the music cannot see for itself (the microphone) wants quiet, or is done. */
export function hushMusic(reason: string, on: boolean): void {
  if (on) holds.add(reason);
  else holds.delete(reason);
}

subscribeSound(sync);
