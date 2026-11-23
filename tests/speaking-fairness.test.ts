import { describe, expect, it } from "vitest";
import { PRONUNCIATION_NOT_ASSESSED, withoutPronunciationGuess } from "@/lib/ai/normalize";
import { mockEvaluate } from "@/lib/ai/mock";
import { SPEAKING_CRITERIA, WRITING_CRITERIA, type Evaluation } from "@/lib/ai/schema";

const evaluation = (bands: number[], names = SPEAKING_CRITERIA, overall = 5): Evaluation => ({
  ...mockEvaluate("speaking", "I like my hometown because it is quiet and green.", 20, names),
  overall_band: overall,
  criteria: names.map((name, i) => ({ name, band: bands[i], comment: "x" })),
});

describe("speaking scores never guess pronunciation from a transcript (D4)", () => {
  it("replaces a low pronunciation guess with the average of the other criteria", () => {
    const e = withoutPronunciationGuess(evaluation([6, 6.5, 6, 3.5], SPEAKING_CRITERIA, 5.5));
    const p = e.criteria.find((c) => /pronunciation/i.test(c.name))!;
    expect(p.band).toBe(6);
    expect(p.comment).toBe(PRONUNCIATION_NOT_ASSESSED);
    expect(e.overall_band).toBe(6);
  });

  it("does not raise the score either", () => {
    const e = withoutPronunciationGuess(evaluation([5, 5, 5, 8], SPEAKING_CRITERIA, 6));
    expect(e.overall_band).toBe(5);
  });

  it("leaves evaluations without a pronunciation criterion alone (writing)", () => {
    const w = evaluation([6, 6, 6, 6], WRITING_CRITERIA, 6);
    expect(withoutPronunciationGuess(w)).toEqual(w);
  });
});
