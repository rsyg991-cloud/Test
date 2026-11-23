import { describe, expect, it } from "vitest";
import { allLessons, conversations, curriculumFrom, generalLessons, practicePrompts, stages, TRACKS } from "@/content";
import { conversationTracks, isGeneralEnglish, lessonTracks, practiceTracks } from "@/content/tracks";

/** Text a learner sees that frames the lesson as exam preparation. */
const EXAM_FRAMING = /\bIELTS\b|\bband\s*\d|\bband score|\bPart [1-4]\b|\bTask [12]\b|cue card|\bexaminer\b/i;

/** Every user-facing string inside a value (keys such as `ieltsPart` are structural, not shown as text). */
function texts(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => texts(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => texts(v, out));
  return out;
}

describe("paths by goal (AC-20)", () => {
  it("gives a General-only learner core lessons only, with General English all the way to Stage 7", () => {
    const path = curriculumFrom(1, 7, ["core"]);
    for (const i of path.filter((x) => x.kind === "lesson")) expect(lessonTracks(i.lesson), i.id).toContain("core");
    expect(Math.max(...path.map((i) => i.stage))).toBe(7);
    for (const g of generalLessons) expect(path.some((i) => i.id === g.id), g.id).toBe(true);
  });

  it("gives the IELTS goal every legacy item, in the same order, plus General English", () => {
    for (const [a, b] of [[1, 7], [4, 7], [2, 5]]) {
      const legacy = curriculumFrom(a, b).map((i) => i.id);
      const withGoal = curriculumFrom(a, b, ["core", "ielts"]).map((i) => i.id);
      expect(withGoal.filter((id) => legacy.includes(id)), `${a}-${b}`).toEqual(legacy);
      expect(withGoal.filter((id) => !legacy.includes(id)).every((id) => id.startsWith("g")), `${a}-${b}`).toBe(true);
    }
  });

  it("keeps the legacy path for learners without goals", async () => {
    const { tracksForGoals, parseGoals, normaliseGoals } = await import("@/content/goals");
    expect(tracksForGoals(parseGoals(null))).toBeUndefined();
    expect(tracksForGoals(parseGoals('["general","work"]'))).toEqual(["core", "work"]);
    expect(normaliseGoals(["ielts", "bogus"])).toEqual(["general", "ielts"]);
    expect(parseGoals("not json")).toBeNull();
  });
});

describe("tracks", () => {
  it("tag every lesson, conversation and practice prompt with known tracks", () => {
    for (const l of allLessons) {
      const t = lessonTracks(l);
      expect(t.length, l.id).toBeGreaterThan(0);
      for (const x of t) expect(TRACKS, l.id).toContain(x);
    }
    for (const c of conversations) expect(conversationTracks(c).length, c.id).toBeGreaterThan(0);
    for (const p of practicePrompts) expect(practiceTracks(p).length, p.id).toBeGreaterThan(0);
  });

  it("tag every IELTS-format lesson of Stages 4–7 as IELTS", () => {
    for (const l of allLessons.filter((x) => x.stage >= 4)) expect(lessonTracks(l), l.id).toContain("ielts");
  });

  it("keep exam framing out of General English content in Stages 0–3", () => {
    for (const s of stages.filter((x) => x.id <= 3)) {
      for (const l of s.units.flatMap((u) => u.lessons).filter((x) => lessonTracks(x).includes("core"))) {
        for (const t of texts(l)) expect(t, `${l.id}: "${t}"`).not.toMatch(EXAM_FRAMING);
      }
    }
    for (const c of conversations.filter((x) => x.stage <= 3 && conversationTracks(x).includes("core"))) {
      const { ieltsPart: _structural, ...shown } = c;
      for (const t of texts(shown)) expect(t, `${c.id}: "${t}"`).not.toMatch(EXAM_FRAMING);
    }
  });
});

describe("task labels", () => {
  it("label General English tasks neutrally and IELTS tasks with their exam part", () => {
    for (const id of ["f1-u1-writing", "f2-u2-speaking", "f1-checkpoint", "f2-checkpoint", "g4-u1-writing"]) expect(isGeneralEnglish(id), id).toBe(true);
    for (const id of ["s1-u1-writing", "s2-u1-speaking", "f3-u1-speaking", "placement", "p1-w1"]) expect(isGeneralEnglish(id), id).toBe(false);
  });
});
