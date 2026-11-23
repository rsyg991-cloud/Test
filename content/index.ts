import { foundation1 } from "./foundation1";
import { foundation2 } from "./foundation2";
import { foundation3 } from "./foundation3";
import { stage1 } from "./stage1";
import { stage2 } from "./stage2";
import { stage3 } from "./stage3";
import { stage4 } from "./stage4";
import { practicePrompts } from "./practice";
import { lessonTracks } from "./tracks";
import { getGeneralLesson } from "./general";
export { generalLessons, generalUnits, getGeneralLesson } from "./general";
import type { Checkpoint, Lesson, PracticePrompt, Stage, Track } from "./types";

export * from "./types";
export { lessonTracks, conversationTracks, practiceTracks } from "./tracks";
export { conversations, getConversation } from "./conversations";

/**
 * Seven stages from absolute beginner to exam mastery. Stages 1–3 are the foundation
 * (A0 → B1, "f1-…" lesson ids, Arabic support); Stages 4–7 are the IELTS stages. Their lesson
 * ids keep their original "s1-…"–"s4-…" prefixes so learners' saved progress stays valid.
 */
export const stages: Stage[] = [foundation1, foundation2, foundation3, stage1, stage2, stage3, stage4];
export { endStageFor, FINAL_STAGE, stageForBand, STAGE_LIST, TARGET_BANDS, pathItemCount } from "./stageList";
import { FINAL_STAGE } from "./stageList";

export const allLessons: Lesson[] = stages.flatMap((s) => s.units.flatMap((u) => u.lessons));

export function getStage(id: number): Stage | undefined {
  return stages.find((s) => s.id === id);
}

/** A lesson of the seven stages, or a General English lesson (content/general). */
export function getLesson(id: string): Lesson | undefined {
  return allLessons.find((l) => l.id === id) ?? getGeneralLesson(id);
}

export function getCheckpoint(id: string): Checkpoint | undefined {
  return stages.find((s) => s.checkpoint.id === id)?.checkpoint;
}

export function getPractice(id: string): PracticePrompt | undefined {
  return practicePrompts.find((p) => p.id === id);
}

export { practicePrompts };

/** An item on the learner's path: a lesson or a stage checkpoint. */
export type PathItem =
  | { kind: "lesson"; id: string; stage: number; lesson: Lesson }
  | { kind: "checkpoint"; id: string; stage: number; checkpoint: Checkpoint };

/**
 * The ordered curriculum from a given stage up to (and including) the end stage.
 *
 * `tracks` filters lessons by the learner's goals (content/tracks.ts). Leaving it out gives every
 * lesson, which is exactly the path existing learners have always had: they all chose an exam
 * target, so they follow the IELTS goal. A stage with no lesson in the chosen tracks is left out
 * altogether. Until General English lessons exist for Stages 4–7, a General-only path stops at Stage 3.
 */
export function curriculumFrom(startStage = 1, endStage: number = FINAL_STAGE, tracks?: readonly Track[]): PathItem[] {
  const items: PathItem[] = [];
  const last = Math.max(startStage, endStage);
  const wanted = (l: Lesson) => !tracks || lessonTracks(l).some((t) => tracks.includes(t));
  for (const s of stages) {
    if (s.id < startStage || s.id > last) continue;
    const lessons = s.units.flatMap((u) => u.lessons).filter(wanted);
    if (tracks && lessons.length === 0) continue;
    for (const l of lessons) items.push({ kind: "lesson", id: l.id, stage: s.id, lesson: l });
    items.push({ kind: "checkpoint", id: s.checkpoint.id, stage: s.id, checkpoint: s.checkpoint });
  }
  return items;
}

/** Overall band needed in a stage checkpoint to unlock the next stage. */
export const passBandFor = (stage: number) => (getStage(stage)?.bandTo ?? 6) - 0.5;
