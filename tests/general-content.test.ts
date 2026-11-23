import { describe, expect, it } from "vitest";
import baseline from "./fixtures/ids-baseline.json";
import { allLessons, checkpointAliases, checkpointFor, conversations, curriculumFrom, generalCheckpoints, generalLessons, generalUnits, getCheckpoint, getLesson, getStage, stages } from "@/content";
import { isGeneralEnglish, lessonTracks } from "@/content/tracks";

const EXAM_FRAMING = /\bIELTS\b|\bband\s*\d|\bband score|\bPart [1-4]\b|\bTask [12]\b|\bexaminer\b/i;
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/** Minimum text lengths per stage (words): longer and denser as the level rises. */
const MIN_READING: Record<number, number> = { 1: 80, 2: 130, 3: 180, 4: 280, 5: 400, 6: 550, 7: 700 };
const MIN_LISTENING: Record<number, number> = { 1: 60, 2: 100, 3: 150, 4: 220, 5: 320, 6: 420, 7: 500 };

function texts(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => texts(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => texts(v, out));
  return out;
}

describe("General English lessons (content/general)", () => {
  it("use new g<stage>-u<unit>-<skill> ids that clash with nothing", () => {
    const taken = new Set([...baseline.lessons.map((l) => l.id), ...allLessons.map((l) => l.id), ...conversations.map((c) => c.id)]);
    const seen = new Set<string>();
    for (const u of generalUnits) {
      expect(u.id).toMatch(new RegExp(`^g${u.stage}-u${u.index}$`));
      for (const l of u.lessons) {
        expect(l.id).toBe(`${u.id}-${l.skill}`);
        expect(l.stage, l.id).toBe(u.stage);
        expect(l.unit, l.id).toBe(u.index);
        expect(taken.has(l.id), l.id).toBe(false);
        expect(seen.has(l.id), l.id).toBe(false);
        seen.add(l.id);
      }
    }
  });

  it("are General English (core) lessons with neutral task labels, found by getLesson", () => {
    for (const l of generalLessons) {
      expect(lessonTracks(l), l.id).toEqual(["core"]);
      expect(isGeneralEnglish(l.id), l.id).toBe(true);
      expect(getLesson(l.id), l.id).toBe(l);
    }
  });

  it("never talk about the exam", () => {
    for (const l of generalLessons) for (const t of texts(l)) expect(t, `${l.id}: "${t}"`).not.toMatch(EXAM_FRAMING);
  });

  it("cover all four skills in every unit, with objectives, a strategy and enough vocabulary", () => {
    for (const u of generalUnits) {
      expect(u.lessons.map((l) => l.skill).sort(), u.id).toEqual(["listening", "reading", "speaking", "writing"]);
      for (const l of u.lessons) {
        expect(l.objectives?.length ?? 0, l.id).toBeGreaterThanOrEqual(2);
        expect(l.strategy.points.length, l.id).toBeGreaterThanOrEqual(3);
        expect(l.vocab.length, l.id).toBeGreaterThanOrEqual(4);
        for (const v of l.vocab) expect(v.example.toLowerCase(), `${l.id}/${v.word}`).toBeTruthy();
      }
    }
  });

  it("have texts long enough for their level and well-formed questions", () => {
    for (const l of generalLessons) {
      const task = l.reading ?? l.listening;
      if (l.reading) expect(words(l.reading.paragraphs.join(" ")), l.id).toBeGreaterThanOrEqual(MIN_READING[l.stage]);
      if (l.listening) {
        expect(words(l.listening.script.map((s) => s.text).join(" ")), l.id).toBeGreaterThanOrEqual(MIN_LISTENING[l.stage]);
        expect(new Set(l.listening.script.map((s) => s.speaker)).size, l.id).toBeGreaterThanOrEqual(2);
      }
      if (!task) continue;
      expect(task.questions.length, l.id).toBeGreaterThanOrEqual(5);
      const ids = task.questions.map((q) => q.id);
      expect(new Set(ids).size, l.id).toBe(ids.length);
      for (const q of task.questions) {
        expect(q.explanation.length, `${l.id}/${q.id}`).toBeGreaterThan(5);
        if (q.type === "mcq") {
          expect(q.answer, `${l.id}/${q.id}`).toBeGreaterThanOrEqual(0);
          expect(q.answer, `${l.id}/${q.id}`).toBeLessThan(q.options.length);
          expect(new Set(q.options).size, `${l.id}/${q.id}`).toBe(q.options.length);
        }
        if (q.type === "gap") {
          expect(q.prompt, `${l.id}/${q.id}`).toContain("___");
          expect(q.answer.length, `${l.id}/${q.id}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it("explain every Stage 3 strategy in Arabic too (the Arabic gradient)", () => {
    for (const l of generalLessons.filter((x) => x.stage <= 3)) {
      expect(l.arabic?.points.length, l.id).toBe(l.strategy.points.length);
      for (const p of l.arabic!.points) expect(p, l.id).toMatch(/[؀-ۿ]/);
    }
  });

  it("give the Arabic meaning of every word and an Arabic explanation of every answer in Stages 1–2", () => {
    for (const l of generalLessons.filter((x) => x.stage <= 2)) {
      for (const v of l.vocab) expect(v.ar, `${l.id}/${v.word}`).toMatch(/[؀-ۿ]/);
      for (const q of (l.reading ?? l.listening)?.questions ?? []) expect(q.ar, `${l.id}/${q.id}`).toMatch(/[؀-ۿ]/);
    }
  });

  it("play recordings slower than normal in Stages 1–3", () => {
    for (const l of generalLessons.filter((x) => x.stage <= 3 && x.listening)) expect(l.listening!.rate, l.id).toBeLessThan(1);
  });

  it("give writing and speaking tasks of a sensible size for the level", () => {
    for (const l of generalLessons) {
      const minWriting: Record<number, number> = { 1: 25, 2: 60, 3: 100, 4: 100, 5: 180, 6: 180, 7: 180 };
      if (l.writing) expect(l.writing.minWords, l.id).toBeGreaterThanOrEqual(minWriting[l.stage]);
      if (l.speaking) expect(l.speaking.questions.length, l.id).toBeGreaterThanOrEqual(1);
    }
  });

  it("check gap answers against the text: every gap answer appears in the reading or recording", () => {
    for (const l of generalLessons) {
      // Numbers read out digit by digit ("4-4-7-1") count as the written number (4471).
      const joinDigits = (s: string) => s.toLowerCase().replace(/(\d)[\s-]+(?=\d)/g, "$1");
      const source = joinDigits(l.reading?.paragraphs.join(" ") ?? l.listening?.script.map((s) => s.text).join(" ") ?? "");
      const task = l.reading ?? l.listening;
      for (const q of task?.questions ?? []) {
        if (q.type !== "gap") continue;
        expect(q.answer.some((a) => source.includes(joinDigits(a))), `${l.id}/${q.id}: ${q.answer.join(" | ")}`).toBe(true);
      }
    }
  });
});

describe("General English checkpoints (content/general/checkpoints)", () => {
  const generalTracks = ["core"] as const;

  it("close Stages 3–7 with new g<stage>-checkpoint ids, found by getCheckpoint", () => {
    expect(generalCheckpoints.map((c) => c.id)).toEqual(["g3-checkpoint", "g4-checkpoint", "g5-checkpoint", "g6-checkpoint", "g7-checkpoint"]);
    const taken = new Set(stages.map((s) => s.checkpoint.id));
    for (const c of generalCheckpoints) {
      expect(c.id, c.id).toBe(`g${c.stage}-checkpoint`);
      expect(taken.has(c.id), c.id).toBe(false);
      expect(getCheckpoint(c.id), c.id).toBe(c);
      expect(isGeneralEnglish(c.id), c.id).toBe(true);
    }
  });

  it("are what a General English path ends each stage with; IELTS and legacy paths keep the stage's own", () => {
    for (const s of stages) {
      const general = curriculumFrom(s.id, s.id, generalTracks).find((i) => i.kind === "checkpoint");
      expect(general?.id, `stage ${s.id}`).toBe(s.id >= 3 ? `g${s.id}-checkpoint` : s.checkpoint.id);
      expect(curriculumFrom(s.id, s.id, ["core", "ielts"]).find((i) => i.kind === "checkpoint")?.id).toBe(s.checkpoint.id);
      expect(curriculumFrom(s.id, s.id).find((i) => i.kind === "checkpoint")?.id).toBe(s.checkpoint.id);
      expect(checkpointFor(s, ["core", "work"]).id).toBe(general?.id);
    }
  });

  it("count as passing the stage either way, so changing goals never means passing a stage twice", () => {
    for (const c of generalCheckpoints) {
      const own = getStage(c.stage)!.checkpoint.id;
      expect(checkpointAliases(c.id).sort()).toEqual([c.id, own].sort());
      expect(checkpointAliases(own).sort()).toEqual([c.id, own].sort());
    }
    expect(checkpointAliases("f1-checkpoint")).toEqual(["f1-checkpoint"]);
  });

  it("never talk about the exam, and test all four skills at the stage's level", () => {
    const minWriting: Record<number, number> = { 3: 120, 4: 150, 5: 180, 6: 220, 7: 250 };
    for (const c of generalCheckpoints) {
      for (const t of texts(c)) expect(t, `${c.id}: "${t}"`).not.toMatch(EXAM_FRAMING);
      expect(words(c.reading.paragraphs.join(" ")), c.id).toBeGreaterThanOrEqual(MIN_READING[c.stage]);
      expect(words(c.listening.script.map((s) => s.text).join(" ")), c.id).toBeGreaterThanOrEqual(MIN_LISTENING[c.stage]);
      expect(new Set(c.listening.script.map((s) => s.speaker)).size, c.id).toBeGreaterThanOrEqual(2);
      if (c.stage <= 3) expect(c.listening.rate, c.id).toBeLessThan(1);
      expect(c.writing.minWords, c.id).toBeGreaterThanOrEqual(minWriting[c.stage]);
      expect(c.speaking.questions.length, c.id).toBeGreaterThanOrEqual(1);
      for (const task of [c.reading, c.listening]) {
        expect(task.questions.length, c.id).toBeGreaterThanOrEqual(6);
        const ids = task.questions.map((q) => q.id);
        expect(new Set(ids).size, c.id).toBe(ids.length);
      }
    }
  });

  it("have well-formed questions whose gap answers appear in the text or recording", () => {
    const joinDigits = (s: string) => s.toLowerCase().replace(/(\d)[\s-]+(?=\d)/g, "$1");
    for (const c of generalCheckpoints) {
      for (const [task, source] of [
        [c.reading, c.reading.paragraphs.join(" ")],
        [c.listening, c.listening.script.map((s) => s.text).join(" ")],
      ] as const) {
        for (const q of task.questions) {
          expect(q.explanation.length, `${c.id}/${q.id}`).toBeGreaterThan(5);
          if (q.type === "mcq") {
            expect(q.answer, `${c.id}/${q.id}`).toBeLessThan(q.options.length);
            expect(new Set(q.options).size, `${c.id}/${q.id}`).toBe(q.options.length);
          }
          if (q.type === "gap") {
            expect(q.prompt, `${c.id}/${q.id}`).toContain("___");
            expect(q.answer.some((a) => joinDigits(source).includes(joinDigits(a))), `${c.id}/${q.id}: ${q.answer.join(" | ")}`).toBe(true);
          }
        }
      }
    }
  });
});
