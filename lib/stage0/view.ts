/**
 * Turns Stage 0 lesson data into what the player renders: every item a step uses, resolved to its
 * text, picture, Arabic meaning, audio text and presentation mode for the learner at that step.
 * Hidden items carry no English text at all, so the browser never receives a spelling the learner
 * hasn't been taught.
 */
import { graphemeById, type Item } from "@/content/items";
import { LETTER_NAMES, sentenceText, stage0ItemById, stage0Lessons, type Stage0Lesson, type Step } from "@/content/stage0";
import { emptyTaught, modeOf, teach, type Mode, type Taught } from "@/lib/phonics";

export interface ViewItem {
  id: string;
  kind: Item["kind"];
  /** English text; absent when the item is hidden. */
  text?: string;
  mode: Mode;
  image?: string;
  ar?: string;
  /** What the audio says (letter names, words, chunks). */
  say: string;
  ipa?: string;
}

export interface ViewStep {
  step: Step;
  items: Record<string, ViewItem>;
  /** For sound steps: a word that contains the sound, said until recorded sounds are approved. */
  soundKeyword?: string;
}

/** Keyword per grapheme, from the teach steps (for the interim spoken hint). */
const keywordOf = new Map<string, string>();
for (const l of stage0Lessons)
  for (const s of l.steps)
    if (s.type === "teach" && s.keyword)
      for (const t of s.teaches) if (t.startsWith("g:") && !keywordOf.has(t)) keywordOf.set(t, s.keyword);

function resolve(id: string, taught: Taught, use: "text" | "keyword" = "text"): ViewItem {
  const x = stage0ItemById.get(id);
  if (!x) throw new Error(`Unknown Stage 0 item ${id}`);
  const mode = modeOf(x, taught, use);
  const base = { id, kind: x.kind, mode };
  switch (x.kind) {
    case "grapheme":
      return { ...base, text: x.spelling.replace("_", "…").replace(/\/.*/, ""), say: x.spelling.replace("_", ""), ipa: x.ipa, ar: x.ar };
    case "pattern":
      return { ...base, text: x.label, ar: x.ar, say: "" };
    case "pseudo":
      return { ...base, ...(mode === "hidden" ? {} : { text: x.text }), say: x.text, ipa: x.ipa };
    default: {
      const image = (x as { image?: string }).image;
      return {
        ...base,
        ...(mode === "hidden" ? {} : { text: x.text }),
        ...(image ? { image } : {}),
        ar: x.ar,
        say: x.text,
        ...("ipa" in x ? { ipa: x.ipa } : {}),
      };
    }
  }
}

function idsOf(s: Step): string[] {
  const out: string[] = [];
  if (s.type === "teach") out.push(...s.teaches, ...(s.keyword ? [s.keyword] : []));
  if ("tokens" in s) out.push(...s.tokens);
  if ("target" in s) out.push(...(Array.isArray(s.target) ? s.target : [s.target]));
  if ("options" in s && s.type !== "namePick") out.push(...s.options);
  if (s.type === "say") out.push(...s.model);
  return [...new Set(out)];
}

/** Knowledge before the first step of a lesson (everything taught in earlier lessons). */
function taughtBefore(lessonId: string): Taught {
  let taught = emptyTaught();
  for (const l of stage0Lessons) {
    if (l.id === lessonId) break;
    for (const s of l.steps) if (s.type === "teach") taught = teach(taught, s.teaches);
  }
  return taught;
}

export function lessonView(lesson: Stage0Lesson): ViewStep[] {
  let taught = taughtBefore(lesson.id);
  return lesson.steps.map((step) => {
    if (step.type === "teach") taught = teach(taught, step.teaches);
    const items: Record<string, ViewItem> = {};
    for (const id of idsOf(step)) {
      const keyword = step.type === "teach" && step.keyword === id;
      items[id] = resolve(id, taught, keyword ? "keyword" : "text");
    }
    const view: ViewStep = { step, items };
    if (step.type === "soundPick") {
      const kw = keywordOf.get(step.target);
      if (kw) view.soundKeyword = (stage0ItemById.get(kw) as { text: string }).text;
    }
    return view;
  });
}

export const letterName = (letter: string) => LETTER_NAMES[letter];
export const graphemeIpa = (id: string) => graphemeById.get(id as `g:${string}`)?.ipa;
export { sentenceText };

export function getStage0Lesson(id: string) {
  return stage0Lessons.find((l) => l.id === id);
}

/** The lesson before this one (lessons open in order). */
export function previousStage0Lesson(id: string) {
  const i = stage0Lessons.findIndex((l) => l.id === id);
  return i > 0 ? stage0Lessons[i - 1] : undefined;
}
