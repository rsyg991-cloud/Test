import { describe, expect, it } from "vitest";
import { stage0Lessons, type Step } from "@/content/stage0";
import { gradeStage0Lesson, isCorrect, type StepAnswer } from "@/lib/stage0/grade";
import { lessonView } from "@/lib/stage0/view";

const lesson = (id: string) => stage0Lessons.find((l) => l.id === id)!;

/** A learner who gets every scored step right on the first try and says every spoken step. */
function perfect(steps: Step[]): StepAnswer[] {
  return steps.map((s): StepAnswer => {
    switch (s.type) {
      case "namePick":
        return { stepId: s.id, choice: s.letter };
      case "spell":
        return { stepId: s.id, typed: "" };
      case "build":
        return { stepId: s.id, order: s.tokens.filter((t) => !t.startsWith("p:")) };
      case "say":
        return { stepId: s.id, recorded: true, selfMark: true };
      case "teach":
      case "show":
        return { stepId: s.id };
      default:
        return { stepId: s.id, choice: s.target };
    }
  });
}

function withSpelling(l: ReturnType<typeof lesson>): StepAnswer[] {
  const views = lessonView(l);
  return perfect(l.steps).map((a, i) => {
    const s = l.steps[i];
    return s.type === "spell" ? { ...a, typed: views[i].items[s.target].text } : a;
  });
}

describe("Stage 0 view sent to the browser", () => {
  it("never includes the English text of a hidden item", () => {
    for (const l of stage0Lessons)
      for (const v of lessonView(l))
        for (const it of Object.values(v.items)) if (it.mode === "hidden") expect(it.text, `${v.step.id}: ${it.id}`).toBeUndefined();
  });

  it("marks the l1 keyword 'tap' hidden while t is taught, and the word readable once p is taught (D1)", () => {
    const views = lessonView(lesson("z0-u1-l1"));
    const atT = views.find((v) => v.step.type === "teach" && v.step.teaches.includes("g:t"))!;
    expect(atT.items["w:tap"].mode).toBe("hidden");
    const decodeTap = views.find((v) => v.step.type === "decodePick" && v.step.target === "w:tap")!;
    expect(decodeTap.items["w:tap"].mode).toBe("readable");
  });
});

describe("Stage 0 server grading", () => {
  it("grades a perfect lesson 100% with credit evidence", () => {
    const l = lesson("z0-u1-l2");
    const g = gradeStage0Lesson(l, withSpelling(l));
    expect(g.pct).toBe(1);
    expect(g.evidence.some((e) => e.dimension === "DC" && e.credit === 1)).toBe(true);
    expect(g.gate).toBeUndefined();
  });

  it("checks spelling case-insensitively and tile order exactly", () => {
    const l = lesson("z0-u1-l1");
    const spell = l.steps.find((s) => s.type === "spell")!;
    expect(isCorrect(spell, { stepId: spell.id, typed: " SAT " })).toBe(spell.type === "spell" && spell.target === "w:sat");
    const build = l.steps.find((s) => s.type === "build")! as Extract<Step, { type: "build" }>;
    const words = build.tokens.filter((t) => !t.startsWith("p:"));
    expect(isCorrect(build, { stepId: build.id, order: words })).toBe(true);
    expect(isCorrect(build, { stepId: build.id, order: [...words].reverse() })).toBe(words.length < 2);
  });

  it("ignores a client claim of correctness: only the chosen option counts", () => {
    const l = lesson("z0-u1-l1");
    const wrong = l.steps.map((s): StepAnswer => ({ stepId: s.id, choice: "w:nonsense" }));
    expect(gradeStage0Lesson(l, wrong).correct).toBe(0);
  });

  it("opens Stage 1 from a strong unit check, and asks to retake decoding when it is weak", () => {
    const check = lesson("z0-u1-check");
    expect(gradeStage0Lesson(check, withSpelling(check)).gate?.unlocksStage1).toBe(true);
    const weak = withSpelling(check).map((a) => {
      const s = check.steps.find((x) => x.id === a.stepId)!;
      return s.type === "decodePick" ? { ...a, choice: "w:nonsense" } : a;
    });
    const gate = gradeStage0Lesson(check, weak).gate!;
    expect(gate.unlocksStage1).toBe(false);
    expect(gate.retake).toEqual(["decoding"]);
  });

  it("never blocks on speaking: no spoken attempts still opens Stage 1 with speaking support (AC-12)", () => {
    const check = lesson("z0-u1-check");
    const gate = gradeStage0Lesson(check, withSpelling(check), { speakingShare: 0 }).gate!;
    expect(gate.unlocksStage1).toBe(true);
    expect(gate.supports).toContain("speaking");
  });

  it("completes a lesson with every speaking step skipped", () => {
    const l = lesson("z0-u1-l1");
    const answers = withSpelling(l).map((a) => (l.steps.find((s) => s.id === a.stepId)!.type === "say" ? { stepId: a.stepId, skipped: true } : a));
    const g = gradeStage0Lesson(l, answers);
    expect(g.pct).toBe(1);
    expect(g.speakingAttempts.tried).toBe(0);
  });
});

describe("Stage 1 supports (D7)", () => {
  it("lowers writing minimums only for Stage 1 tasks with writing support (AC-16)", async () => {
    const { supportedMinWords } = await import("@/lib/stage0/feedback");
    expect(supportedMinWords(25, ["writing"], "f1-u1-writing")).toBe(15);
    expect(supportedMinWords(50, ["writing"], "f1-checkpoint")).toBe(30);
    expect(supportedMinWords(25, ["reading"], "f1-u1-writing")).toBe(25);
    expect(supportedMinWords(60, ["writing"], "f2-u1-writing")).toBe(60);
  });

  it("reads both stored feedback formats", async () => {
    const { readFeedback } = await import("@/lib/stage0/feedback");
    expect(readFeedback('[{"itemId":"w:sit"}]').evidence).toHaveLength(1);
    expect(readFeedback('{"evidence":[],"gate":{"supports":["writing"]}}').gate?.supports).toEqual(["writing"]);
    expect(readFeedback("not json")).toEqual({ evidence: [], gate: null });
  });
});
