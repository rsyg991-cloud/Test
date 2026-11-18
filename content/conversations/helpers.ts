import type { KeyPhrase, ListeningTask } from "../types";

export const kp = (phrase: string, use: string, example: string): KeyPhrase => ({ phrase, use, example });

type Line = [speaker: string, voice: "female" | "male", text: string];

/** A model dialogue, played with the same audio player as Listening lessons. */
export const dialogue = (context: string, lines: Line[]): ListeningTask => ({
  context,
  script: lines.map(([speaker, voice, text]) => ({ speaker, voice, text })),
  questions: [],
});
