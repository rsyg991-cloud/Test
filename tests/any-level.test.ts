import { describe, expect, it } from "vitest";
import { curriculumFrom, endStageFor, FINAL_STAGE, pathItemCount, STAGE_LIST, stageForBand, stages } from "@/content";
import { bandFromScore, cefrForBand } from "@/lib/scoring";
import { paceWarning, PLANS, recommendPlan } from "@/lib/plan/scheduler";

describe("stage summary for client components", () => {
  it("matches the full curriculum", () => {
    expect(STAGE_LIST).toEqual(
      stages.map((s) => ({
        id: s.id,
        name: s.name,
        camp: s.camp,
        cefr: s.cefr,
        bandFrom: s.bandFrom,
        bandTo: s.bandTo,
        foundation: !!s.foundation,
        items: s.units.reduce((n, u) => n + u.lessons.length, 0) + 1,
      })),
    );
  });

  it("counts path items the same way as the curriculum", () => {
    for (const [a, b] of [[1, 7], [1, 3], [4, 5], [3, 6]]) expect(pathItemCount(a, b)).toBe(curriculumFrom(a, b).length);
  });
});

describe("foundation stages (A0 → B1)", () => {
  const foundation = stages.filter((s) => s.foundation);
  const lessons = foundation.flatMap((s) => s.units.flatMap((u) => u.lessons));

  it("are the first three stages, with f-prefixed ids", () => {
    expect(foundation.map((s) => s.id)).toEqual([1, 2, 3]);
    for (const l of lessons) expect(l.id).toMatch(/^f[123]-u[123]-(reading|listening|writing|speaking)$/);
  });

  it("explain every strategy in Arabic", () => {
    for (const l of lessons) {
      expect(l.arabic?.points.length, l.id).toBe(l.strategy.points.length);
      for (const p of l.arabic!.points) expect(p, l.id).toMatch(/[؀-ۿ]/);
    }
  });

  it("give Arabic meanings for words and answers in Stages 1–2", () => {
    for (const l of lessons.filter((x) => x.stage <= 2)) {
      for (const v of l.vocab) expect(v.ar, `${l.id}/${v.word}`).toMatch(/[؀-ۿ]/);
      for (const q of (l.reading ?? l.listening)?.questions ?? []) expect(q.ar, `${l.id}/${q.id}`).toMatch(/[؀-ۿ]/);
    }
  });

  it("play listening slower than normal", () => {
    for (const l of lessons.filter((x) => x.listening)) expect(l.listening!.rate, l.id).toBeLessThan(1);
  });
});

describe("any-level placement and paths", () => {
  it("places learners from zero to C1", () => {
    expect(stageForBand(bandFromScore(0, 0))).toBe(1);
    expect(stageForBand(3.5)).toBe(2);
    expect(stageForBand(4)).toBe(3);
    expect(stageForBand(5)).toBe(4);
    expect(stageForBand(6)).toBe(5);
    expect(stageForBand(7)).toBe(6);
    expect(stageForBand(8)).toBe(7);
  });

  it("ends the path at the stage that reaches the target band", () => {
    expect(endStageFor(4)).toBe(2);
    expect(endStageFor(4.5)).toBe(3);
    expect(endStageFor(5)).toBe(4);
    expect(endStageFor(6)).toBe(5);
    expect(endStageFor(6.5)).toBe(5);
    expect(endStageFor(7)).toBe(6);
    expect(endStageFor(7.5)).toBe(FINAL_STAGE);
    expect(endStageFor(null)).toBe(FINAL_STAGE);
    expect(curriculumFrom(1, endStageFor(4)).every((i) => i.stage <= 2)).toBe(true);
    expect(curriculumFrom(5, 4)).toHaveLength(13); // never shorter than the start stage
  });

  it("labels beginner bands with A-levels", () => {
    expect(cefrForBand(1.5)).toBe("A0");
    expect(cefrForBand(2.5)).toBe("A1");
    expect(cefrForBand(3.5)).toBe("A2");
  });
});

describe("plans for beginners", () => {
  it("offers 9- and 12-month plans", () => {
    expect(PLANS.map((p) => p.months)).toEqual([1, 2, 3, 4, 6, 9, 12]);
  });

  it("recommends a year for an absolute beginner aiming at Band 6.5", () => {
    expect(recommendPlan(1.5, 6.5, null)).toBe(12);
    expect(recommendPlan(3, 5.5, null)).toBe(9);
  });

  it("warns honestly when a plan is too short for the path", () => {
    const everything = pathItemCount(1, 7);
    expect(paceWarning(1, everything)).toMatch(/Very tight/);
    expect(paceWarning(12, everything)).toBeNull();
    expect(paceWarning(3, pathItemCount(5, 5))).toBeNull();
  });
});
