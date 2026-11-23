import type { ConversationScenario, Lesson, PracticePrompt, Track } from "./types";

/**
 * Which track each piece of existing content belongs to. Tags are metadata only: ids, stage numbers
 * and saved progress never change. tests/tracks.test.ts checks that everything has a tag and that
 * General English (core) content in Stages 0–3 never talks about the exam.
 *
 * - Stages 1–2 (f1-, f2-): General English.
 * - Stage 3 (f3-): only the lessons free of exam framing are core; the rest are the "IELTS preview",
 *   until General English replacements (g3-…) are written.
 * - Stages 4–7 (s1- … s4-): IELTS format throughout; the lectures, tutorials and academic readings are
 *   also EAP material.
 */
const STAGE3_CORE = new Set(["f3-u3-reading", "f3-u3-listening"]);

const ALSO_EAP = new Set([
  "s1-u2-listening",
  "s2-u3-listening",
  "s3-u1-reading",
  "s3-u1-listening",
  "s3-u2-reading",
  "s3-u2-listening",
  "s3-u3-listening",
  "s4-u1-listening",
  "s4-u3-listening",
]);

export function lessonTracks(lesson: Pick<Lesson, "id">): Track[] {
  const { id } = lesson;
  if (/^z0-|^f[12]-|^g\d-/.test(id)) return ["core"];
  if (id.startsWith("f3-")) return STAGE3_CORE.has(id) ? ["core"] : ["ielts"];
  if (/^s[1-4]-/.test(id)) return ALSO_EAP.has(id) ? ["ielts", "eap"] : ["ielts"];
  if (id.startsWith("eap-")) return ["eap"];
  if (id.startsWith("wk-")) return ["work"];
  return [];
}

const CONVERSATION_TRACKS: Record<string, Track[]> = {
  "cf1-hello": ["core"],
  "cf1-coffee": ["core"],
  "cf2-directions": ["core"],
  "cf2-weekend": ["core"],
  "cf3-doctor": ["core"],
  "cf3-plans": ["core"],
  "c1-meet-classmate": ["core"],
  "c1-cafe-order": ["core"],
  "c1-directions": ["core"],
  "c1-phone-booking": ["core", "work"],
  "c1-part1-examiner": ["ielts"],
  "c2-weekend-plans": ["core"],
  "c2-trip-story": ["ielts"],
  "c2-job-interview": ["work", "core"],
  "c2-environment-debate": ["core", "ielts"],
  "c2-part3-technology": ["ielts"],
  "c3-four-day-week": ["eap", "ielts"],
  "c3-seminar": ["eap"],
  "c3-complaint": ["work", "core"],
  "c3-part3-education-ai": ["ielts"],
  "c3-part2-3-full": ["ielts"],
  "c4-full-mock-a": ["ielts"],
  "c4-full-mock-b": ["ielts"],
  "c4-unexpected": ["ielts"],
  "c4-explain-chart": ["ielts", "work"],
  "c4-c1-discussion": ["ielts", "eap"],
};

export function conversationTracks(c: Pick<ConversationScenario, "id">): Track[] {
  return CONVERSATION_TRACKS[c.id] ?? [];
}

/** All existing practice prompts are IELTS Writing Task 2 / Speaking Parts 1–3 prompts. */
export function practiceTracks(p: Pick<PracticePrompt, "id">): Track[] {
  return /^p[1-4]-/.test(p.id) ? ["ielts"] : [];
}
