import { foundation1 } from "./foundation1";
import { foundation2 } from "./foundation2";
import { foundation3 } from "./foundation3";
import { stage1 } from "./stage1";
import { stage2 } from "./stage2";
import { stage3 } from "./stage3";
import { stage4 } from "./stage4";
import { practicePrompts } from "./practice";
import type { Checkpoint, Lesson, PracticePrompt, Stage } from "./types";

export * from "./types";
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

export function getLesson(id: string): Lesson | undefined {
  return allLessons.find((l) => l.id === id);
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

/** The ordered curriculum from a given stage up to (and including) the end stage. */
export function curriculumFrom(startStage = 1, endStage: number = FINAL_STAGE): PathItem[] {
  const items: PathItem[] = [];
  const last = Math.max(startStage, endStage);
  for (const s of stages) {
    if (s.id < startStage || s.id > last) continue;
    for (const u of s.units) {
      for (const l of u.lessons) items.push({ kind: "lesson", id: l.id, stage: s.id, lesson: l });
    }
    items.push({ kind: "checkpoint", id: s.checkpoint.id, stage: s.id, checkpoint: s.checkpoint });
  }
  return items;
}

/** Overall band needed in a stage checkpoint to unlock the next stage. */
export const passBandFor = (stage: number) => (getStage(stage)?.bandTo ?? 6) - 0.5;
