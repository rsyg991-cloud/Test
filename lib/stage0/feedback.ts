import type { Evidence } from "@/lib/learning/evidence";
import { writingMinimum, type GateDecision, type Stage0Results, type Support } from "@/lib/learning/gates";

/** What a Stage 0 Attempt stores in feedbackJson. */
export interface Stage0Feedback {
  evidence: Evidence[];
  /** Unit check only: the exit decision (supports to switch on in Stage 1). */
  gate: (GateDecision & { results: Stage0Results }) | null;
}

/** Reads feedbackJson, including the first format (a bare evidence array). */
export function readFeedback(json: string | null | undefined): Stage0Feedback {
  try {
    const v = JSON.parse(json ?? "null");
    if (Array.isArray(v)) return { evidence: v, gate: null };
    if (v && typeof v === "object") return { evidence: Array.isArray(v.evidence) ? v.evidence : [], gate: v.gate ?? null };
  } catch {}
  return { evidence: [], gate: null };
}

/** Does this lesson or checkpoint id belong to Stage 1? */
export const isStage1Ref = (refId: string) => refId.startsWith("f1-");

/** Writing minimum for a Stage 1 task with or without writing supports (15 words, 30 at the checkpoint). */
export function supportedMinWords(taskMin: number, supports: Support[], refId: string): number {
  if (!isStage1Ref(refId) || !supports.includes("writing")) return taskMin;
  return writingMinimum(taskMin, { supported: true, checkpoint: refId.endsWith("-checkpoint") });
}
