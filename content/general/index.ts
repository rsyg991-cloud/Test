import type { Lesson, Unit } from "../types";
import { generalStage4 } from "./stage4";

/**
 * General English lessons written for the redesign ("g3-" … "g7-"). They live outside `stages` on
 * purpose: adding them there would change existing learners' paths and stage percentages. They open
 * from the General English page and the normal lesson page, by stage, as each stage is unlocked.
 */
export const generalUnits: Unit[] = [...generalStage4];

export const generalLessons: Lesson[] = generalUnits.flatMap((u) => u.lessons);

export function getGeneralLesson(id: string): Lesson | undefined {
  return generalLessons.find((l) => l.id === id);
}
