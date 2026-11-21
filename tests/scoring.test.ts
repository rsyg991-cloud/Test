import { describe, expect, it } from "vitest";
import { allLessons, stages } from "@/content";
import { mockEvaluate } from "@/lib/ai/mock";
import { EvaluationSchema } from "@/lib/ai/schema";
import { bandFromScore, clampBand, estimateSkillBand, gradeQuestions, isCorrect, overallBand, roundBand } from "@/lib/scoring";
import { review } from "@/lib/srs";

describe("IELTS band rounding", () => {
  it("rounds .25 up to .5 and .75 up to the next whole band", () => {
    expect(roundBand(6.25)).toBe(6.5);
    expect(roundBand(6.75)).toBe(7);
    expect(roundBand(6.125)).toBe(6);
    expect(roundBand(6.6)).toBe(6.5);
  });
  it("computes the overall band from four skills", () => {
    expect(overallBand({ reading: 6.5, listening: 6.5, writing: 5, speaking: 7 })).toBe(6.5); // 6.25 → 6.5
    expect(overallBand({ reading: 4, listening: 3.5, writing: 4, speaking: 4 })).toBe(4); // 3.875 → 4
    expect(overallBand({})).toBeNull();
  });
  it("clamps anything to 1–9", () => {
    expect(clampBand(12)).toBe(9);
    expect(clampBand(-1)).toBe(1);
    expect(clampBand("x")).toBe(5);
  });
});

describe("answer checking", () => {
  const gap = { id: "g", type: "gap" as const, prompt: "___", answer: ["70,000", "seventy thousand"], explanation: "" };
  it("accepts numbers with or without separators, case and article differences", () => {
    expect(isCorrect(gap, "70000")).toBe(true);
    expect(isCorrect(gap, " Seventy Thousand ")).toBe(true);
    expect(isCorrect(gap, "7000")).toBe(false);
    expect(isCorrect({ ...gap, answer: ["map"] }, "the map")).toBe(true);
    expect(isCorrect({ ...gap, answer: ["6.50"] }, "£6.50")).toBe(true);
  });
  it("grades a set and reports the percentage", () => {
    const qs = stages[0].units[0].lessons[0].reading!.questions;
    const answers = Object.fromEntries(qs.map((q) => [q.id, q.type === "mcq" ? q.answer : q.type === "tfng" ? q.answer : q.answer[0]]));
    expect(gradeQuestions(qs, answers).pct).toBe(1);
    expect(gradeQuestions(qs, {}).pct).toBe(0);
  });
  it("maps scores into each stage's difficulty window", () => {
    expect(bandFromScore(1, 1)).toBeLessThan(bandFromScore(1, 4));
    expect(bandFromScore(0.5, 2)).toBeGreaterThan(bandFromScore(0.2, 2));
  });
  it("weights recent and checkpoint snapshots more heavily", () => {
    expect(estimateSkillBand([])).toBeNull();
    expect(estimateSkillBand([{ band: 7, source: "checkpoint" }, { band: 5, source: "lesson" }])).toBeGreaterThanOrEqual(6.5);
  });
});

describe("curriculum integrity", () => {
  it("has 7 stages × 3 units × 4 skills with unique ids and valid answers", () => {
    expect(stages).toHaveLength(7);
    expect(stages.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(allLessons).toHaveLength(84);
    expect(new Set(allLessons.map((l) => l.id)).size).toBe(84);
    for (const s of stages) {
      for (const u of s.units) {
        expect(u.stage, u.id).toBe(s.id);
        for (const l of u.lessons) expect(l.stage, l.id).toBe(s.id);
      }
      expect(s.checkpoint.stage).toBe(s.id);
    }
    for (const l of allLessons) {
      const task = l.reading ?? l.listening ?? l.writing ?? l.speaking;
      expect(task, l.id).toBeTruthy();
      expect(l.vocab.length, l.id).toBeGreaterThanOrEqual(4);
      for (const q of (l.reading ?? l.listening)?.questions ?? []) {
        if (q.type === "mcq") expect(q.answer, `${l.id}/${q.id}`).toBeLessThan(q.options.length);
        if (q.type === "gap") expect(q.prompt, `${l.id}/${q.id}`).toContain("___");
      }
    }
    for (const s of stages) expect(s.units.flatMap((u) => u.lessons.map((l) => l.skill)).sort()).toEqual([..."rrrlllwwwsss"].map((c) => ({ r: "reading", l: "listening", w: "writing", s: "speaking" })[c]).sort());
  });
});

describe("spaced repetition", () => {
  it("grows intervals for good answers and resets on a lapse", () => {
    let c = { ease: 2.5, interval: 0, reps: 0 };
    c = review(c, 4);
    expect(c.interval).toBe(1);
    c = review(c, 4);
    expect(c.interval).toBe(3);
    c = review(c, 4);
    expect(c.interval).toBeGreaterThan(6);
    c = review(c, 0);
    expect(c).toMatchObject({ interval: 1, reps: 0 });
    expect(c.ease).toBeGreaterThanOrEqual(1.3);
  });
});

describe("offline evaluator", () => {
  it("returns a schema-valid evaluation with four criteria", () => {
    const essay = "In my opinion, studying in a group is better. Firstly, students can share ideas. For example, when I prepared for exams, my friends explained difficult topics. However, it can be noisy. In conclusion, groups help most people learn.";
    const e = mockEvaluate("writing", essay, 100);
    expect(() => EvaluationSchema.parse(e)).not.toThrow();
    expect(e.criteria).toHaveLength(4);
    expect(e.overall_band).toBeGreaterThanOrEqual(3);
    expect(e.overall_band).toBeLessThanOrEqual(8);
    expect(e.demo).toBe(true);
  });
});
