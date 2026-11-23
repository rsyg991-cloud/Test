/**
 * Leaving Stage 0. Listening and reading are hard gates (they open Stage 1); writing and speaking
 * are soft gates: a shortfall never blocks, it switches on Stage 1 supports and carry-over review.
 * No gate ever uses speech recognition or a pronunciation score.
 */
export interface Stage0Results {
  /** Aural recognition on sampled core words and chunks (0–1). */
  AR: number;
  /** Written-form recognition of letters. */
  WFletters: number;
  /** Decoding of novel readable words and pseudo-words. */
  DC: number;
  /** Meaning from reading a short text. */
  MCR: number;
  /** Spelling of readable words. */
  SP: number;
  /** Building utterances from tiles. */
  PU: number;
  /** Share of core speaking items the learner attempted (practice, not a score). */
  speakingAttempts: number;
}

export const STAGE0_GATES = {
  hard: { AR: 0.8, WFletters: 0.9, DC: 0.8, MCR: 0.75 },
  soft: { SP: 0.6, PU: 0.75, speakingAttempts: 0.8 },
} as const;

export type Support = "reading" | "writing" | "speaking" | "listening";

export interface GateDecision {
  unlocksStage1: boolean;
  /** Hard-gate sections to retake after a targeted 10-minute review. */
  retake: ("listening" | "letters" | "decoding" | "readingMeaning")[];
  /** Stage 1 supports to switch on. */
  supports: Support[];
}

export function stage0Exit(r: Stage0Results): GateDecision {
  const h = STAGE0_GATES.hard;
  const s = STAGE0_GATES.soft;
  const retake: GateDecision["retake"] = [];
  if (r.AR < h.AR) retake.push("listening");
  if (r.WFletters < h.WFletters) retake.push("letters");
  if (r.DC < h.DC) retake.push("decoding");
  if (r.MCR < h.MCR) retake.push("readingMeaning");

  const supports: Support[] = [];
  if (r.DC < 0.9 || r.MCR < 0.85) supports.push("reading");
  if (r.SP < s.SP || r.PU < s.PU) supports.push("writing");
  if (r.speakingAttempts < s.speakingAttempts) supports.push("speaking");
  if (r.AR < 0.9) supports.push("listening");

  return { unlocksStage1: retake.length === 0, retake, supports };
}

/**
 * Minimum words for a Stage 1 writing task. With writing supports the first task asks for 15 words
 * (instead of 25) and the checkpoint 30 (instead of 50); the Stage 2 gate then needs the full minimum.
 */
export function writingMinimum(taskMin: number, opts: { supported: boolean; checkpoint: boolean }): number {
  if (!opts.supported) return taskMin;
  return opts.checkpoint ? Math.min(taskMin, 30) : Math.min(taskMin, 15);
}
