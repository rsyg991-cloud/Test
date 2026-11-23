import { describe, expect, it } from "vitest";
import { allLessons, conversations, practicePrompts, stages, TRACKS } from "@/content";
import { conversationTracks, lessonTracks, practiceTracks } from "@/content/tracks";

/** Text a learner sees that frames the lesson as exam preparation. */
const EXAM_FRAMING = /\bIELTS\b|\bband\s*\d|\bband score|\bPart [1-4]\b|\bTask [12]\b|cue card|\bexaminer\b/i;

/** Every user-facing string inside a value (keys such as `ieltsPart` are structural, not shown as text). */
function texts(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => texts(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => texts(v, out));
  return out;
}

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
