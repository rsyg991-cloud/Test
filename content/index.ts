import { foundation1 } from "./foundation1";
import { foundation2 } from "./foundation2";
import { foundation3 } from "./foundation3";
import { stage1 } from "./stage1";
import { stage2 } from "./stage2";
import { stage3 } from "./stage3";
import { stage4 } from "./stage4";
import { practicePrompts } from "./practice";
import { lessonTracks } from "./tracks";
import { generalLessons, getGeneralCheckpoint, getGeneralLesson } from "./general";
export { generalCheckpoints, generalLessons, generalUnits, getGeneralCheckpoint, getGeneralLesson } from "./general";
import type { Checkpoint, Lesson, PracticePrompt, Stage, Track } from "./types";

export * from "./types";
export { lessonTracks, conversationTracks, practiceTracks } from "./tracks";
export { GOALS, normaliseGoals, parseGoals, tracksForGoals, wantsIelts, type Goal } from "./goals";
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

/** A stage checkpoint, or a General English one (content/general/checkpoints). */
export function getCheckpoint(id: string): Checkpoint | undefined {
  return stages.find((s) => s.checkpoint.id === id)?.checkpoint ?? getGeneralCheckpoint(id);
}

/**
 * The checkpoint a learner takes at the end of a stage. A path built from tracks without IELTS gets
 * the General English checkpoint where one exists (Stages 3–7); every other path, including the
 * legacy one (no tracks), keeps the stage's own checkpoint.
 */
export function checkpointFor(stage: Stage, tracks?: readonly Track[]): Checkpoint {
  if (!tracks || tracks.includes("ielts")) return stage.checkpoint;
  return getGeneralCheckpoint(`g${stage.id}-checkpoint`) ?? stage.checkpoint;
}

/** Every checkpoint that closes a stage (the stage's own and the General English one), by id. */
export function stageCheckpointIds(stage: Stage): string[] {
  const g = getGeneralCheckpoint(`g${stage.id}-checkpoint`);
  return g ? [stage.checkpoint.id, g.id] : [stage.checkpoint.id];
}

/**
 * Passing either checkpoint of a stage closes it, so a learner who changes goals never has to pass
 * the same stage twice: given a checkpoint id, all the ids that count as passed with it.
 */
export function checkpointAliases(id: string): string[] {
  const cp = getCheckpoint(id);
  const stage = cp && getStage(cp.stage);
  return stage ? stageCheckpointIds(stage) : [id];
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
 * target, so they follow the IELTS goal. A path with tracks that include the core also gets that
 * stage's General English lessons (content/general), after the stage's own lessons. A stage with no
 * lesson in the chosen tracks is left out altogether.
 */
export function curriculumFrom(startStage = 1, endStage: number = FINAL_STAGE, tracks?: readonly Track[]): PathItem[] {
  const items: PathItem[] = [];
  const last = Math.max(startStage, endStage);
  const wanted = (l: Lesson) => !tracks || lessonTracks(l).some((t) => tracks.includes(t));
  for (const s of stages) {
    if (s.id < startStage || s.id > last) continue;
    const general = tracks?.includes("core") ? generalLessons.filter((l) => l.stage === s.id) : [];
    const lessons = [...s.units.flatMap((u) => u.lessons).filter(wanted), ...general];
    if (tracks && lessons.length === 0) continue;
    for (const l of lessons) items.push({ kind: "lesson", id: l.id, stage: s.id, lesson: l });
    const cp = checkpointFor(s, tracks);
    items.push({ kind: "checkpoint", id: cp.id, stage: s.id, checkpoint: cp });
  }
  return items;
}

/** Overall band needed in a stage checkpoint to unlock the next stage. */
export const passBandFor = (stage: number) => (getStage(stage)?.bandTo ?? 6) - 0.5;
