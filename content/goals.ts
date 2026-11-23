import type { Track } from "./types";

/**
 * What a learner wants English for, chosen at onboarding (several allowed). General English is the
 * core every path is built on; the others add tracks. Stored as JSON in User.goals.
 * No goals stored (null) = a learner who joined before goals existed: they all chose an exam
 * target, so their path stays exactly as it was (every lesson of the seven stages).
 */
export type Goal = "general" | "ielts" | "academic" | "work";
export const GOALS: Goal[] = ["general", "ielts", "academic", "work"];

export function parseGoals(json: string | null | undefined): Goal[] | null {
  if (!json) return null;
  try {
    const v = JSON.parse(json);
    if (!Array.isArray(v)) return null;
    const goals = v.filter((g): g is Goal => GOALS.includes(g));
    return goals.length ? goals : null;
  } catch {
    return null;
  }
}

/** Keep only known goals, in a stable order, always including General English. */
export function normaliseGoals(goals: readonly string[]): Goal[] {
  const set = new Set(goals.filter((g): g is Goal => GOALS.includes(g as Goal)));
  set.add("general");
  return GOALS.filter((g) => set.has(g));
}

/** The tracks a learner's path is built from. undefined = the legacy path (all stage lessons). */
export function tracksForGoals(goals: readonly Goal[] | null): Track[] | undefined {
  if (!goals) return undefined;
  const tracks: Track[] = ["core"];
  if (goals.includes("ielts")) tracks.push("ielts");
  if (goals.includes("academic")) tracks.push("eap");
  if (goals.includes("work")) tracks.push("work");
  return tracks;
}

export const wantsIelts = (goals: readonly Goal[] | null) => !goals || goals.includes("ielts");

/** Learners without the IELTS goal see their progress as a CEFR level, never as a band or band target. */
export const showsLevels = (goalsJson: string | null | undefined) => !wantsIelts(parseGoals(goalsJson));
