"use client";

/** Pick an English voice for a speaker, preferring British voices, with distinct voices for female/male where possible. */
export function pickVoice(gender: "female" | "male"): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("en"));
  if (voices.length === 0) return null;
  const femaleHints = /(female|woman|samantha|victoria|karen|moira|tessa|serena|kate|susan|zira|hazel|libby|sonia|jenny|aria|fiona|google uk english female)/i;
  const maleHints = /(male|man|daniel|alex|fred|oliver|george|ryan|guy|david|mark|arthur|thomas|google uk english male)/i;
  const prefer = (list: SpeechSynthesisVoice[]) =>
    list.find((v) => /en-gb/i.test(v.lang)) ?? list.find((v) => /en-(au|ie|nz)/i.test(v.lang)) ?? list[0];
  const gendered = voices.filter((v) => (gender === "female" ? femaleHints.test(v.name) && !/\bmale\b/i.test(v.name.replace(/female/i, "")) : maleHints.test(v.name) && !/female/i.test(v.name)));
  return prefer(gendered.length ? gendered : voices) ?? null;
}

export function speak(text: string, opts: { gender?: "female" | "male"; rate?: number } = {}): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    const voice = pickVoice(opts.gender ?? "female");
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang;
    } else u.lang = "en-GB";
    u.rate = opts.rate ?? 1;
    // Make two speakers distinguishable even if only one voice is installed.
    u.pitch = opts.gender === "male" ? 0.85 : 1.1;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

export function ttsSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

// Minimal typing for the Web Speech recognition API (not in TS DOM lib everywhere).
export interface RecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

export function createRecognition(): RecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => RecognitionLike; webkitSpeechRecognition?: new () => RecognitionLike };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const r = new Ctor();
  r.continuous = true;
  r.interimResults = true;
  r.lang = "en-GB";
  return r;
}

export function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function fmtTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
