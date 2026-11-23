import { describe, expect, it } from "vitest";
import baseline from "./fixtures/ids-baseline.json";
import { conversations, curriculumFrom, endStageFor, getCheckpoint, getConversation, getLesson, getPractice, getStage, practicePrompts } from "@/content";
import { builtInTests } from "@/content/mock";

/**
 * Learners' saved progress points at these ids (LessonProgress.lessonId, Attempt.refId, User.startStage …).
 * The curriculum redesign may ADD stages, lessons and tracks, but must never remove or renumber what is here,
 * and must never change the path of a learner who already exists. Do not regenerate the fixture to pass.
 */
describe("ids that saved progress depends on", () => {
  it("keeps every stage, its slug and its checkpoint id", () => {
    for (const s of baseline.stages) {
      expect(getStage(s.id)?.slug, `stage ${s.id}`).toBe(s.slug);
      expect(getStage(s.id)?.checkpoint.id, `stage ${s.id}`).toBe(s.checkpoint);
      expect(getCheckpoint(s.checkpoint), s.checkpoint).toBeDefined();
    }
  });

  it("keeps every lesson with the same stage and skill", () => {
    for (const l of baseline.lessons) {
      const now = getLesson(l.id);
      expect(now, l.id).toBeDefined();
      expect(now!.stage, l.id).toBe(l.stage);
      expect(now!.skill, l.id).toBe(l.skill);
    }
  });

  it("keeps every conversation, practice prompt and built-in mock test", () => {
    for (const c of baseline.conversations) expect(getConversation(c.id)?.stage, c.id).toBe(c.stage);
    for (const p of baseline.practice) expect(getPractice(p.id)?.stage, p.id).toBe(p.stage);
    for (const id of baseline.mockTests) expect(builtInTests.some((t) => t.id === id), id).toBe(true);
  });

  it("never reuses an id for two things", () => {
    const ids = [
      ...curriculumFrom(0, 99).map((i) => i.id),
      ...conversations.map((c) => c.id),
      ...practicePrompts.map((p) => p.id),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("existing learners' paths", () => {
  it("maps every target band to the same end stage", () => {
    for (const [band, end] of Object.entries(baseline.endStageFor)) {
      expect(endStageFor(band === "null" ? null : Number(band)), band).toBe(end);
    }
  });

  it("gives every start/end stage pair the same items in the same order", () => {
    for (const [key, ids] of Object.entries(baseline.paths)) {
      const [start, end] = key.split("-").map(Number);
      expect(curriculumFrom(start, end).map((i) => i.id), key).toEqual(ids);
    }
  });
});
