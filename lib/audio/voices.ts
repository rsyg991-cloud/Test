/**
 * Recorded audio, generated ahead of time with Kokoro (open source, Apache-2.0) by
 * scripts/audio/generate.py. Every spoken text has one file per voice, named by a hash of the voice
 * and the text, so the browser finds it without a manifest; if a file is missing, speech falls
 * back to the browser's own voice (components/task/speech.ts).
 *
 * Shared by the browser and the generator (scripts/audio/manifest.ts): keep it free of imports.
 */

export type Gender = "female" | "male";

/** Kokoro voices, best first. Speakers of the same gender in one recording get different voices. */
export const VOICES: Record<Gender, readonly string[]> = {
  female: ["af_heart", "bf_emma", "af_nicole"],
  male: ["am_michael", "bm_george", "am_adam"],
};

/** The voice for a text spoken on its own (a word, a question, a passage). */
export const defaultVoice = (gender: Gender = "female") => VOICES[gender][0];

/** One voice per line of a recording: each speaker keeps a voice, different from other speakers of their gender. */
export function scriptVoices(script: readonly { speaker: string; voice: Gender; text?: string }[]): string[] {
  const bySpeaker = new Map<string, string>();
  const used: Record<Gender, number> = { female: 0, male: 0 };
  return script.map((l) => {
    const k = `${l.voice}|${l.speaker}`;
    if (!bySpeaker.has(k)) bySpeaker.set(k, VOICES[l.voice][used[l.voice]++ % VOICES[l.voice].length]);
    return bySpeaker.get(k)!;
  });
}

/** cyrb53: a small, well-distributed 53-bit string hash (same result in Node and the browser). */
function cyrb53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/** Texts are matched after trimming and collapsing spaces, so formatting never breaks the link. */
export const normaliseSpoken = (text: string) => text.replace(/\s+/g, " ").trim();

export function audioPath(voice: string, text: string): string {
  return `/audio/${voice}/${cyrb53(`${voice}|${normaliseSpoken(text)}`).toString(36)}.mp3`;
}
