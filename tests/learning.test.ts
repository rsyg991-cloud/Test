import { describe, expect, it } from "vitest";
import { stage0Lessons, type Step } from "@/content/stage0";
import { evidenceFor } from "@/lib/learning/evidence";
import { stage0Exit, writingMinimum } from "@/lib/learning/gates";
import { applyCredit, buildSession, eligible, gradeFor, needsReteach, newPair, type PairState } from "@/lib/learning/review";

const steps = stage0Lessons.flatMap((l) => l.steps);
const first = <T extends Step["type"]>(type: T, pred: (s: Extract<Step, { type: T }>) => boolean = () => true) =>
  steps.find((s): s is Extract<Step, { type: T }> => s.type === type && pred(s as Extract<Step, { type: T }>))!;

describe("evidence (D3)", () => {
  const decode = first("decodePick", (s) => !s.target.startsWith("pw:"));
  const pseudo = first("decodePick", (s) => s.target.startsWith("pw:"));

  it("gives nothing for teach or show steps, and exposure only when audio played first (AC-7)", () => {
    expect(evidenceFor({ step: first("show"), mode: "readable", audioBeforeAnswer: true, correct: true })).toBeNull();
    expect(evidenceFor({ step: decode, mode: "readable", audioBeforeAnswer: true, correct: true })).toMatchObject({ kind: "exposure", credit: 0 });
  });

  it("credits decoding only from readable text with audio withheld (AC-8)", () => {
    expect(evidenceFor({ step: decode, mode: "readable", audioBeforeAnswer: false, correct: true })).toMatchObject({ dimension: "DC", kind: "credit", credit: 1 });
    expect(evidenceFor({ step: decode, mode: "supported", audioBeforeAnswer: false, correct: true })).toMatchObject({ kind: "exposure" });
  });

  it("counts a recently seen real word as shape recognition, not decoding; pseudo-words always count (AC-9)", () => {
    expect(evidenceFor({ step: decode, mode: "readable", audioBeforeAnswer: false, correct: true, seenRecently: true })).toMatchObject({ dimension: "WF" });
    expect(evidenceFor({ step: pseudo, mode: "readable", audioBeforeAnswer: false, correct: true, seenRecently: true })).toMatchObject({ dimension: "DC" });
  });

  it("gives half credit after a hint", () => {
    expect(evidenceFor({ step: decode, mode: "readable", audioBeforeAnswer: false, correct: true, hinted: true })?.credit).toBe(0.5);
  });

  it("never scores speech; a self-mark is worth half at most (AC-11)", () => {
    const say = first("say");
    expect(evidenceFor({ step: say, mode: "readable", audioBeforeAnswer: true, correct: true })).toMatchObject({ kind: "exposure", credit: 0 });
    expect(evidenceFor({ step: say, mode: "readable", audioBeforeAnswer: true, correct: true, selfMark: true })).toMatchObject({ dimension: "OR", credit: 0.5 });
  });

  it("scores building a sentence deterministically (AC-13)", () => {
    expect(evidenceFor({ step: first("build"), mode: "readable", audioBeforeAnswer: false, correct: true })).toMatchObject({ dimension: "PU", credit: 1 });
  });
});

describe("review per (item, dimension)", () => {
  const now = new Date("2026-12-01T10:00:00Z");

  it("maps credits to SM-2 grades", () => {
    expect([gradeFor(1), gradeFor(0.5), gradeFor(0)]).toEqual([4, 3, 0]);
  });

  it("resets only the failed dimension and marks four lapses for re-teaching", () => {
    let p = newPair("w:sit", "SP", now);
    p = applyCredit(applyCredit(p, 1, now), 1, now);
    expect(p.interval).toBeGreaterThan(1);
    for (let i = 0; i < 4; i++) p = applyCredit(p, 0, now);
    expect(p.interval).toBe(1);
    expect(needsReteach(p)).toBe(true);
  });

  it("respects prerequisites between dimensions", () => {
    const s = (v: Record<string, number>) => (d: string) => v[d] ?? 0;
    expect(eligible("DC", s({}), false)).toBe(false);
    expect(eligible("SP", s({ DC: 0.5 }), true)).toBe(false);
    expect(eligible("SP", s({ DC: 0.7 }), true)).toBe(true);
    expect(eligible("OR", s({ AR: 0.7 }), true)).toBe(true);
    expect(eligible("PU", s({ OR: 0.2, SP: 0.65 }), true)).toBe(true);
  });

  it("builds a capped, interleaved session, at least half recall and use, one dimension per item", () => {
    const past = new Date(now.getTime() - 1000);
    const pairs: PairState[] = [];
    for (let i = 0; i < 30; i++) {
      pairs.push({ ...newPair(`w:${i}`, "AR", past), strength: 0.9 });
      pairs.push({ ...newPair(`w:${i}`, "DC", past), strength: 0.3 });
      pairs.push({ ...newPair(`w:${i}`, "SP", past), strength: 0.2 });
    }
    const session = buildSession(pairs, {
      now,
      readable: () => true,
      newItems: Array.from({ length: 12 }, (_, i) => ({ itemId: `w:n${i}`, dimension: "AR" as const })),
    });
    const reviews = session.filter((p) => p.reps > 0 || !p.itemId.startsWith("w:n"));
    expect(reviews.length).toBeLessThanOrEqual(25);
    expect(session.length - reviews.length).toBeLessThanOrEqual(8);
    expect(new Set(reviews.map((p) => p.itemId)).size).toBe(reviews.length);
    expect(reviews.filter((p) => ["SP", "OR", "PU", "DC"].includes(p.dimension)).length).toBeGreaterThanOrEqual(reviews.length / 2);
    // SP isn't eligible yet (DC strength 0.3 < 0.6), so the weakest eligible dimension is DC.
    expect(reviews.every((p) => p.dimension === "DC")).toBe(true);
  });
});

describe("Stage 0 exit (hard and soft gates)", () => {
  const strong = { AR: 0.95, WFletters: 0.97, DC: 0.92, MCR: 0.9, SP: 0.8, PU: 0.9, speakingAttempts: 1 };

  it("opens Stage 1 when listening and reading pass, with no supports for a strong learner (AC-14)", () => {
    expect(stage0Exit(strong)).toEqual({ unlocksStage1: true, retake: [], supports: [] });
  });

  it("never blocks on writing or speaking, but switches on supports (AC-15)", () => {
    const d = stage0Exit({ ...strong, SP: 0.3, PU: 0.4, speakingAttempts: 0 });
    expect(d.unlocksStage1).toBe(true);
    expect(d.supports).toEqual(expect.arrayContaining(["writing", "speaking"]));
  });

  it("asks to retake only the failed hard-gate section", () => {
    expect(stage0Exit({ ...strong, DC: 0.6 })).toMatchObject({ unlocksStage1: false, retake: ["decoding"] });
  });

  it("lowers Stage 1 writing minimums only with writing supports (AC-16)", () => {
    expect(writingMinimum(25, { supported: true, checkpoint: false })).toBe(15);
    expect(writingMinimum(50, { supported: true, checkpoint: true })).toBe(30);
    expect(writingMinimum(25, { supported: false, checkpoint: false })).toBe(25);
  });
});
