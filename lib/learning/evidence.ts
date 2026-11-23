/**
 * What an answer proves. Each (item, dimension) is credited on its own: seeing and hearing a word
 * together is exposure, not evidence of reading; recognising a word's shape is not decoding; a
 * self-marked spoken answer is worth at most half.
 */
import type { Dimension, Step } from "@/content/stage0/types";
import type { Mode } from "@/lib/phonics";

export interface Answer {
  step: Step;
  /** Presentation mode of the step's target for this learner at this step. */
  mode: Mode;
  /** Was the target's audio played before the learner answered? */
  audioBeforeAnswer: boolean;
  correct: boolean;
  /** Correct only after a hint or a second try. */
  hinted?: boolean;
  /** Spoken answers: the learner's own "I said it right" (true) or "not yet" (false). */
  selfMark?: boolean;
  /** DC only: the learner saw this exact word in one of their previous 3 sessions. */
  seenRecently?: boolean;
}

export interface Evidence {
  itemId: string;
  dimension: Dimension;
  kind: "credit" | "exposure";
  /** 0, 0.5 or 1. Always 0 for exposure. */
  credit: number;
}

/** The item a step tests (the one its evidence is about). */
export const targetOf = (s: Step): string | undefined => {
  if (s.type === "say") return s.target[0];
  if (s.type === "build") return s.tokens.find((t) => !t.startsWith("p:"));
  if (s.type === "namePick") return `letter:${s.letter}`;
  return "target" in s ? s.target : undefined;
};

export function evidenceFor(a: Answer): Evidence | null {
  const s = a.step;
  if (s.type === "teach" || s.type === "show") return null;
  const itemId = targetOf(s);
  if (!itemId) return null;
  const exposure = (dimension: Dimension): Evidence => ({ itemId, dimension, kind: "exposure", credit: 0 });
  const score = a.correct ? (a.hinted ? 0.5 : 1) : 0;

  switch (s.type) {
    case "say":
      // Speech recognition never scores. Only the learner's own comparison with the model counts, capped at half.
      if (a.selfMark === undefined) return exposure("OR");
      return { itemId, dimension: "OR", kind: "credit", credit: a.selfMark ? 0.5 : 0 };
    case "readPick":
    case "readText":
    case "readSentence":
    case "decodePick":
    case "nameSpellPick": {
      // Written-form and decoding evidence only from text the learner could read, with no audio first.
      const readableText = a.mode === "readable" || a.mode === "sight";
      if (!readableText || a.audioBeforeAnswer) return exposure(s.dimension);
      // Decoding must be of a word not memorised: a pseudo-word, or one not seen in the last 3 sessions.
      if (s.type === "decodePick" && !s.target.startsWith("pw:") && a.seenRecently) return { itemId, dimension: "WF", kind: "credit", credit: score };
      return { itemId, dimension: s.dimension, kind: "credit", credit: score };
    }
    case "spell":
      if (s.input === "keyboard" && a.mode !== "readable") return exposure("SP");
      return { itemId, dimension: "SP", kind: "credit", credit: score };
    default:
      return { itemId, dimension: s.dimension, kind: "credit", credit: score };
  }
}
