import { Howl } from "howler";
import { suspenseBeats } from "../game/suspense";

/**
 * Sound effects. Each sound plays your file from /public/sfx if one exists, and otherwise a
 * synthesized stand-in built with the Web Audio API, so the game has sound before you supply
 * any files. Nothing plays until the first tap (browsers block audio before a gesture).
 */
export type SfxName = "shake" | "toss" | "drumroll" | "stamp" | "crinkle" | "whirr" | "win" | "spin" | "tick" | "pen";

const FILES: Record<SfxName, string> = {
  shake: "/sfx/shake.mp3",
  toss: "/sfx/toss.mp3",
  drumroll: "/sfx/drumroll.mp3",
  stamp: "/sfx/stamp.mp3",
  crinkle: "/sfx/crinkle.mp3",
  whirr: "/sfx/whirr.mp3",
  win: "/sfx/win.mp3",
  spin: "/sfx/spin.mp3",
  tick: "/sfx/tick.mp3",
  pen: "/sfx/pen.mp3",
};

const MUTE_KEY = "kallan-um-police:muted";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
const howls: Partial<Record<SfxName, Howl>> = {};
let muted = readMuted();
let probed = false;
const listeners = new Set<() => void>();

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export const isMuted = () => muted;

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setMuted(next: boolean): void {
  muted = next;
  try {
    localStorage.setItem(MUTE_KEY, next ? "1" : "0");
  } catch {
    /* not persisted */
  }
  if (master) master.gain.value = next ? 0 : 1;
  Object.values(howls).forEach((h) => h?.mute(next));
  listeners.forEach((f) => f());
}

function audio(): AudioContext | null {
  if (ctx) return ctx;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 1;
  master.connect(ctx.destination);
  // one second of white noise, reused by every synthesized sound
  noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return ctx;
}

/** Call from the first user gesture. Starts the audio engine and looks for supplied files. */
export function unlock(): void {
  const c = audio();
  if (c && c.state === "suspended") void c.resume();
  if (probed) return;
  probed = true;
  (Object.keys(FILES) as SfxName[]).forEach((name) => {
    // A missing file often comes back as the app's index.html with status 200, so check the type.
    fetch(FILES[name], { method: "HEAD" })
      .then((r) => {
        if (r.ok && (r.headers.get("content-type") ?? "").startsWith("audio")) {
          howls[name] = new Howl({ src: [FILES[name]], preload: true, mute: muted });
        }
      })
      .catch(() => undefined);
  });
}

// ---------- synthesized sounds ----------

type Out = GainNode;

/** A short burst of filtered noise: the building block of rattles, drum hits and thumps. */
function burst(out: Out, t: number, dur: number, freq: number, q: number, gain: number, type: BiquadFilterType = "bandpass") {
  const c = ctx!;
  const src = c.createBufferSource();
  src.buffer = noise;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0002), t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(out);
  src.start(t, Math.random() * 0.8, dur + 0.02);
}

/** A pitched thump: a sine that drops in frequency. */
function thump(out: Out, t: number, from: number, to: number, dur: number, gain: number) {
  const c = ctx!;
  const o = c.createOscillator();
  o.frequency.setValueAtTime(from, t);
  o.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function group(): { out: Out; stop: () => void } {
  const c = ctx!;
  const out = c.createGain();
  out.connect(master!);
  return {
    out,
    stop: () => {
      out.gain.cancelScheduledValues(c.currentTime);
      out.gain.setTargetAtTime(0, c.currentTime, 0.03);
      window.setTimeout(() => out.disconnect(), 300);
    },
  };
}

const synth: Record<SfxName, (o: Out, opts: PlayOptions) => void> = {
  /** Paper being rattled: many tiny random rustles that fade off. */
  shake(out, { duration = 0.8 }) {
    const t0 = ctx!.currentTime;
    const n = Math.floor(duration / 0.045);
    for (let k = 0; k < n; k++) {
      const fade = 1 - (k / n) * 0.55;
      burst(out, t0 + k * 0.045 + Math.random() * 0.02, 0.07, 1800 + Math.random() * 3200, 1.1, 0.34 * fade * (0.45 + Math.random() * 0.55));
    }
    // a low bump now and then, like paper hitting the table
    for (let k = 0; k < 4; k++) thump(out, t0 + 0.1 + k * (duration / 4.5), 150, 70, 0.1, 0.16);
  },
  /** Chits landing on wood: `count` soft taps, slightly staggered. */
  toss(out, { count = 1 }) {
    const t0 = ctx!.currentTime;
    for (let i = 0; i < count; i++) {
      const t = t0 + i * 0.045 + Math.random() * 0.02;
      thump(out, t, 170 + Math.random() * 40, 60, 0.13, 0.32);
      burst(out, t, 0.06, 900, 0.7, 0.22, "lowpass");
    }
  },
  /** Snare roll that speeds up and swells, with a low rumble underneath. It ends before `duration`. */
  drumroll(out, { duration = 2.6 }) {
    const c = ctx!;
    const t0 = c.currentTime;
    const end = duration - 0.3; // leave a held-breath gap before the verdict
    let t = 0;
    while (t < end) {
      const p = t / end;
      burst(out, t0 + t, 0.05, 1500 + Math.random() * 900, 0.8, 0.06 + 0.4 * p * p);
      t += 0.11 - 0.07 * p;
    }
    const rumble = c.createOscillator();
    rumble.frequency.value = 52;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.28, t0 + end);
    g.gain.linearRampToValueAtTime(0.0001, t0 + end + 0.06);
    rumble.connect(g).connect(out);
    rumble.start(t0);
    rumble.stop(t0 + end + 0.1);
    // heartbeat thumps, on the same beats the screen pulses to
    suspenseBeats(duration).forEach((b) => {
      thump(out, t0 + b, 70, 42, 0.16, 0.55);
      thump(out, t0 + b + 0.16, 62, 40, 0.14, 0.4);
    });
  },
  /** Paper being crumpled or smoothed out: quick high, uneven crackles. */
  crinkle(out, { duration = 0.55 }) {
    const t0 = ctx!.currentTime;
    let t = 0;
    while (t < duration) {
      const fade = 1 - t / duration;
      burst(out, t0 + t, 0.02 + Math.random() * 0.03, 3500 + Math.random() * 4000, 2.2, (0.12 + Math.random() * 0.3) * fade);
      t += 0.012 + Math.random() * 0.05;
    }
  },
  /** Film projector: a steady mechanical whirr with a 24-per-second shutter flutter. */
  whirr(out, { duration = 1.4 }) {
    const c = ctx!;
    const t0 = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    const f = c.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 520;
    f.Q.value = 1.4;
    const flutter = c.createGain();
    flutter.gain.value = 0.5;
    const lfo = c.createOscillator();
    lfo.frequency.value = 24;
    const depth = c.createGain();
    depth.gain.value = 0.5;
    lfo.connect(depth).connect(flutter.gain);
    const env = c.createGain();
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(0.28, t0 + 0.12);
    env.gain.setValueAtTime(0.28, t0 + duration - 0.25);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    src.connect(f).connect(flutter).connect(env).connect(out);
    src.start(t0);
    lfo.start(t0);
    src.stop(t0 + duration + 0.05);
    lfo.stop(t0 + duration + 0.05);
  },
  /** Victory: a rising brass-style fanfare into a held chord, sparkle on top, then applause. */
  win(out) {
    const c = ctx!;
    const t0 = c.currentTime;
    const tone = (freq: number, t: number, dur: number, level: number) => {
      const o = c.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = freq;
      const f = c.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.setValueAtTime(700, t);
      f.frequency.linearRampToValueAtTime(3200, t + 0.08); // the "blat" of a brass attack
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(level, t + 0.03);
      g.gain.setValueAtTime(level, t + dur * 0.7);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(f).connect(g).connect(out);
      o.start(t);
      o.stop(t + dur + 0.02);
    };
    // C E G, then a big C major chord
    [523.25, 659.25, 783.99].forEach((f, i) => tone(f, t0 + i * 0.16, 0.22, 0.13));
    [523.25, 659.25, 783.99, 1046.5].forEach((f) => tone(f, t0 + 0.5, 1.3, 0.12));
    // sparkle: quick high notes
    [2093, 2637, 3136, 4186].forEach((f, i) => {
      const o = c.createOscillator();
      o.frequency.value = f;
      const g = c.createGain();
      const t = t0 + 0.55 + i * 0.07;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.06, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.connect(g).connect(out);
      o.start(t);
      o.stop(t + 0.55);
    });
    // applause: lots of tiny claps that swell and fade
    for (let k = 0; k < 90; k++) {
      const t = 0.55 + Math.random() * 2.4;
      const swell = Math.sin(((t - 0.55) / 2.4) * Math.PI);
      burst(out, t0 + t, 0.03, 1800 + Math.random() * 4500, 0.9, 0.05 + 0.13 * swell * Math.random());
    }
  },
  /** Wheel launch: a whoosh that sweeps up in pitch. */
  spin(out) {
    const c = ctx!;
    const t0 = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    const f = c.createBiquadFilter();
    f.type = "bandpass";
    f.Q.value = 2.5;
    f.frequency.setValueAtTime(250, t0);
    f.frequency.exponentialRampToValueAtTime(2400, t0 + 0.7);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.4, t0 + 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.95);
    src.connect(f).connect(g).connect(out);
    src.start(t0);
    src.stop(t0 + 1);
    thump(out, t0, 200, 90, 0.12, 0.25);
  },
  /** The wheel's pointer flicking past a peg: a tiny dry click. */
  tick(out) {
    const t0 = ctx!.currentTime;
    burst(out, t0, 0.022, 2600, 3, 0.5);
    thump(out, t0, 900, 400, 0.02, 0.12);
  },
  /** A pen scratching on paper: fast, uneven, high-pitched scritches over a faint low rub. */
  pen(out, { duration = 0.6 }) {
    const t0 = ctx!.currentTime;
    let t = 0;
    while (t < duration) {
      burst(out, t0 + t, 0.02 + Math.random() * 0.02, 5000 + Math.random() * 4000, 1.3, 0.05 + Math.random() * 0.07);
      t += 0.012 + Math.random() * 0.024;
    }
    burst(out, t0, duration, 900, 0.6, 0.05, "lowpass");
  },
  /** Rubber stamp / badge hitting a desk. */
  stamp(out) {
    const t0 = ctx!.currentTime;
    thump(out, t0, 120, 42, 0.32, 0.95);
    burst(out, t0, 0.07, 1100, 0.6, 0.55);
    burst(out, t0 + 0.02, 0.18, 300, 0.5, 0.3, "lowpass");
  },
};

export interface PlayOptions {
  /** Seconds, for sounds that fill a window (shake, drumroll). */
  duration?: number;
  /** For toss: how many chits land. */
  count?: number;
}

export interface Playing {
  stop: () => void;
}

/** Play a sound. Safe to call at any time: does nothing until the first tap unlocks audio. */
export function play(name: SfxName, opts: PlayOptions = {}): Playing {
  const none: Playing = { stop: () => undefined };
  const c = audio();
  if (!c || c.state !== "running") return none;
  const file = howls[name];
  if (file) {
    const id = file.play();
    return { stop: () => file.stop(id) };
  }
  const g = group();
  synth[name](g.out, opts);
  return { stop: g.stop };
}
