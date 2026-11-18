import { describe, expect, it } from "vitest";
import { curriculumFrom } from "@/content";
import { addDays } from "@/lib/dates";
import { catchUpStart, computeToday, isReviewDay, PLANS, planDays, recommendPlan, scheduleItems } from "@/lib/plan/scheduler";

const N = curriculumFrom(1).length;

describe("scheduleItems", () => {
  it.each(PLANS.map((p) => p.months))("schedules every item inside a %i-month plan, in order, never on review days", (months) => {
    const s = scheduleItems(months, N);
    expect(s).toHaveLength(N);
    expect(Math.max(...s)).toBeLessThan(planDays(months));
    for (let i = 1; i < s.length; i++) expect(s[i]).toBeGreaterThanOrEqual(s[i - 1]);
    expect(s.some(isReviewDay)).toBe(false);
  });

  it("puts more items per day on shorter plans", () => {
    const perDay = (m: number) => N / new Set(scheduleItems(m, N)).size;
    expect(perDay(1)).toBeGreaterThan(perDay(3));
    expect(perDay(3)).toBeGreaterThanOrEqual(perDay(6));
  });

  it("places each stage checkpoint after that stage's lessons", () => {
    const items = curriculumFrom(1);
    const s = scheduleItems(2, items.length);
    items.forEach((it, i) => {
      if (it.kind !== "checkpoint") return;
      const lastLesson = items.map((x, j) => (x.kind === "lesson" && x.stage === it.stage ? j : -1)).filter((j) => j >= 0).pop()!;
      expect(s[i]).toBeGreaterThanOrEqual(s[lastLesson]);
    });
  });
});

describe("computeToday", () => {
  const start = new Date("2026-01-01T00:00:00Z");

  it("gives day-1 work on the first day", () => {
    const t = computeToday({ months: 3, planStart: start, today: start, itemCount: N, completed: Array(N).fill(false) });
    expect(t.dayNumber).toBe(1);
    expect(t.dueIndices[0]).toBe(0);
    expect(t.behind).toBe(0);
  });

  it("reports how far behind the learner is and caps the daily load", () => {
    const t = computeToday({ months: 1, planStart: start, today: addDays(start, 10), itemCount: N, completed: Array(N).fill(false) });
    expect(t.behind).toBeGreaterThan(5);
    expect(t.dueIndices.length).toBeLessThanOrEqual(6);
  });

  it("offers a get-ahead lesson when everything due is done", () => {
    const completed = Array(N).fill(false);
    completed[0] = completed[1] = true;
    const t = computeToday({ months: 6, planStart: start, today: start, itemCount: N, completed });
    expect(t.aheadMode).toBe(true);
    expect(t.dueIndices).toEqual([2]);
  });

  it("is finished when everything is complete", () => {
    const t = computeToday({ months: 3, planStart: start, today: addDays(start, 5), itemCount: N, completed: Array(N).fill(true) });
    expect(t.finished).toBe(true);
    expect(t.dueIndices).toEqual([]);
  });
});

describe("catchUpStart", () => {
  it("shifts the plan so the first unfinished item lands on today", () => {
    const start = new Date("2026-01-01T00:00:00Z");
    const today = addDays(start, 20);
    const newStart = catchUpStart({ months: 3, planStart: start, today, itemCount: N, firstIncomplete: 3 });
    const t = computeToday({ months: 3, planStart: newStart, today, itemCount: N, completed: Array(N).fill(false).map((_, i) => i < 3) });
    expect(t.behind).toBe(0);
    expect(t.dueIndices[0]).toBe(3);
  });
});

describe("recommendPlan", () => {
  it("scales with the band gap", () => {
    expect(recommendPlan(6.5, 7, null)).toBe(2);
    expect(recommendPlan(6, 7, null)).toBe(3);
    expect(recommendPlan(5, 7, null)).toBe(6);
  });
  it("never recommends a plan that ends after the exam", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    expect(recommendPlan(5, 7, addDays(now, 65), now)).toBe(2);
    expect(recommendPlan(5, 7, addDays(now, 20), now)).toBe(1);
  });
});
