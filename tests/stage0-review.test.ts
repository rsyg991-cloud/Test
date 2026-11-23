import { describe, expect, it } from "vitest";
import { stage0ItemById, stage0Lessons, type Step } from "@/content/stage0";
import { gradeStage0Lesson, type StepAnswer } from "@/lib/stage0/grade";
import { pairsFromAttempts, planReview, reviewableStep } from "@/lib/stage0/review";
import { lessonView } from "@/lib/stage0/view";

const DAY = 86_400_000;
const lesson = (id: string) => stage0Lessons.find((l) => l.id === id)!;
const text = (id: string) => (stage0ItemById.get(id) as { text?: string }).text ?? "";

/** The answer a learner who knows everything gives (or a wrong one). */
function answer(s: Step, right: boolean): StepAnswer | null {
  switch (s.type) {
    case "teach":
    case "show":
    case "say":
      return null;
    case "namePick":
      return { stepId: s.id, choice: right ? s.letter : "?" };
    case "spell":
      return { stepId: s.id, typed: right ? text(s.target) : "zzz" };
    case "build":
      return { stepId: s.id, order: right ? s.tokens.filter((t) => !t.startsWith("p:")) : [] };
    default:
      return { stepId: s.id, choice: right ? s.target : "nope" };
  }
}

function attempt(id: string, right: boolean, at: Date) {
  const l = lesson(id);
  const answers = l.steps.map((s) => answer(s, right)).filter((a): a is StepAnswer => !!a);
  const g = gradeStage0Lesson(l, answers);
  return { createdAt: at, feedbackJson: JSON.stringify({ evidence: g.evidence, gate: null }) };
}

describe("Stage 0 daily review", () => {
  const t0 = new Date("2026-11-01T09:00:00Z");
  const done = new Set(["z0-u0-l1", "z0-u1-l1"]);

  it("rebuilds review state from stored evidence: right answers come back later, wrong ones sooner", () => {
    const good = pairsFromAttempts([attempt("z0-u1-l1", true, t0)]);
    const bad = pairsFromAttempts([attempt("z0-u1-l1", false, t0)]);
    expect(good.length).toBeGreaterThan(5);
    for (const p of good) expect(p.due.getTime()).toBeGreaterThan(t0.getTime());
    for (const p of bad) expect(p.lapses).toBe(1);
    // Nothing is due straight after a good lesson; a few days later it is.
    expect(planReview(good, done, new Date(t0.getTime() + 60_000)).lesson.steps).toHaveLength(0);
    expect(planReview(good, done, new Date(t0.getTime() + 60_000)).nextDue).not.toBeNull();
    expect(planReview(good, done, new Date(t0.getTime() + 3 * DAY)).lesson.steps.length).toBeGreaterThan(0);
  });

  it("asks only scored steps from completed lessons, capped, each once", () => {
    const pairs = pairsFromAttempts([attempt("z0-u1-l1", false, t0)]);
    const plan = planReview(pairs, done, new Date(t0.getTime() + 2 * DAY), 10);
    const ids = plan.lesson.steps.map((s) => s.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.length).toBeLessThanOrEqual(10);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of plan.lesson.steps) {
      expect(["teach", "show", "say"]).not.toContain(s.type);
      expect(reviewableStep(s.id, done)).toBe(s);
    }
  });

  it("never asks a step from a lesson the learner hasn't completed", () => {
    const later = lesson("z0-u1-l3").steps.find((s) => s.type === "spell" || s.type === "readPick")!;
    expect(reviewableStep(later.id, done)).toBeUndefined();
    expect(reviewableStep(later.id, new Set([...done, "z0-u1-l2", "z0-u1-l3"]))).toBe(later);
  });

  it("shows and grades the session with what the learner has been taught, and its evidence moves the schedule on", () => {
    const at = new Date(t0.getTime() + 2 * DAY);
    const plan = planReview(pairsFromAttempts([attempt("z0-u1-l1", false, t0)]), done, at);
    // No English text the learner hasn't been taught reaches the browser.
    for (const v of lessonView(plan.lesson, plan.taught)) for (const it of Object.values(v.items)) if (it.mode === "hidden") expect(it.text).toBeUndefined();
    const answers = plan.lesson.steps.map((s) => answer(s, true)).filter((a): a is StepAnswer => !!a);
    const g = gradeStage0Lesson(plan.lesson, answers, { taught: plan.taught });
    expect(g.total).toBe(plan.lesson.steps.length);
    expect(g.correct).toBe(g.total);
    const after = pairsFromAttempts([attempt("z0-u1-l1", false, t0), { createdAt: at, feedbackJson: JSON.stringify({ evidence: g.evidence, gate: null }) }]);
    const reviewed = new Set(g.evidence.filter((e) => e.kind === "credit").map((e) => `${e.itemId}|${e.dimension}`));
    for (const p of after) if (reviewed.has(`${p.itemId}|${p.dimension}`)) expect(p.due.getTime()).toBeGreaterThan(at.getTime());
  });
});

describe("Stage 0 review: daily cap", () => {
  it("counts today's review questions and stops at the daily cap", async () => {
    const { reviewsLeftToday, DAILY_REVIEWS, REVIEW_ID } = await import("@/lib/stage0/review");
    const now = new Date("2026-11-05T15:00:00Z");
    const answers = (n: number) => JSON.stringify(Array.from({ length: n }, (_, i) => ({ stepId: `s${i}` })));
    expect(reviewsLeftToday([], now)).toBe(DAILY_REVIEWS);
    const today = { createdAt: new Date("2026-11-05T08:00:00Z"), refId: REVIEW_ID, responseJson: answers(10) };
    const yesterday = { createdAt: new Date("2026-11-04T20:00:00Z"), refId: REVIEW_ID, responseJson: answers(15) };
    const lesson = { createdAt: new Date("2026-11-05T09:00:00Z"), refId: "z0-u1-l2", responseJson: answers(30) };
    expect(reviewsLeftToday([today, yesterday, lesson], now)).toBe(DAILY_REVIEWS - 10);
    expect(reviewsLeftToday([today, { ...today }], now)).toBe(0);
  });
});
