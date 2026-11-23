"use server";

import { revalidatePath } from "next/cache";
import { stage0Lessons } from "@/content/stage0";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { flags } from "@/lib/flags";
import { getT } from "@/lib/i18n/server";
import { recordActivity, type ActivityResult } from "@/lib/progress";
import { gradeStage0Lesson, type LessonGrade, type StepAnswer } from "@/lib/stage0/grade";
import { combineStage0Checks } from "@/lib/learning/gates";
import { getStage0Lesson, previousStage0Lesson } from "@/lib/stage0/view";
import { readFeedback, type Stage0Feedback } from "@/lib/stage0/feedback";

/**
 * Stage 0 progress lives in the existing tables, so no database change is needed:
 * - LessonProgress: lessonId "z0-…", stage 0, skill "starter";
 * - Attempt: kind "stage0", the answers and the per-dimension evidence (for review scheduling).
 * Stage 0 never creates band snapshots or vocabulary cards: an IELTS band means nothing at this level.
 */

/** The last Stage 0 check: passing it opens Stage 1. */
const FINAL_CHECK = stage0Lessons[stage0Lessons.length - 1].id;

export interface Stage0Completion {
  ok: true;
  grade: Omit<LessonGrade, "results">;
  activity: ActivityResult;
  firstTime: boolean;
  unlockedStage1: boolean;
  nextHref: string;
}

export async function completeStage0Lesson(lessonId: string, answers: StepAnswer[]): Promise<Stage0Completion | { ok: false; error: string }> {
  const { t } = await getT();
  if (!flags.stage0()) return { ok: false, error: t("errors.lessonNotFound") };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: t("errors.loginAgain") };
  const lesson = getStage0Lesson(lessonId);
  if (!lesson) return { ok: false, error: t("errors.lessonNotFound") };

  const done = new Set(
    (await prisma.lessonProgress.findMany({ where: { userId: user.id, stage: 0 }, select: { lessonId: true } })).map((p) => p.lessonId),
  );
  const prev = previousStage0Lesson(lessonId);
  if (prev && !done.has(prev.id)) return { ok: false, error: t("errors.stageLocked") };

  // Words seen in the learner's previous 3 Stage 0 sessions: decoding them again proves recognition, not decoding.
  const recent = await prisma.attempt.findMany({
    where: { userId: user.id, kind: "stage0" },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: { feedbackJson: true, responseJson: true },
  });
  const recentlySeen = new Set<string>();
  for (const r of recent) for (const e of readFeedback(r.feedbackJson).evidence) recentlySeen.add(e.itemId);

  // Unit check: share of the unit's spoken steps tried in earlier lessons (soft gate, never blocks).
  let speakingShare = 1;
  if (lessonId.endsWith("-check")) {
    const unit = lesson.unit;
    const unitLessons = stage0Lessons.filter((l) => (lessonId === FINAL_CHECK || l.unit === unit) && !l.id.endsWith("-check"));
    const totalSay = unitLessons.reduce((n, l) => n + l.steps.filter((s) => s.type === "say").length, 0);
    const attempts = await prisma.attempt.findMany({
      where: { userId: user.id, kind: "stage0", refId: { in: unitLessons.map((l) => l.id) } },
      orderBy: { createdAt: "desc" },
      select: { refId: true, responseJson: true },
    });
    const tried = new Set<string>();
    for (const a of attempts) {
      for (const ans of JSON.parse(a.responseJson) as StepAnswer[]) if (!ans.skipped && (ans.recorded || ans.selfMark !== undefined)) tried.add(ans.stepId);
    }
    const sayIds = new Set(unitLessons.flatMap((l) => l.steps.filter((s) => s.type === "say").map((s) => s.id)));
    speakingShare = totalSay ? [...tried].filter((id) => sayIds.has(id)).length / totalSay : 1;
  }

  const grade = gradeStage0Lesson(lesson, Array.isArray(answers) ? answers.slice(0, 400) : [], { recentlySeen, speakingShare });

  // Leaving Stage 0 is decided at the final check, combining both unit checks: letters, decoding and
  // spelling from the Unit 1 check (its latest attempt), reading for meaning, listening and building
  // sentences from this one. Earlier unit checks only show what to review.
  const isFinal = lesson.id === FINAL_CHECK;
  if (isFinal && grade.gate) {
    const u1 = await prisma.attempt.findFirst({
      where: { userId: user.id, kind: "stage0", refId: "z0-u1-check" },
      orderBy: { createdAt: "desc" },
      select: { feedbackJson: true },
    });
    grade.gate = combineStage0Checks(grade.gate.results, readFeedback(u1?.feedbackJson).gate?.results);
  }

  await prisma.attempt.create({
    data: {
      userId: user.id,
      kind: "stage0",
      refId: lesson.id,
      skill: "starter",
      score: grade.pct,
      band: null,
      responseJson: JSON.stringify(answers),
      feedbackJson: JSON.stringify({ evidence: grade.evidence, gate: grade.gate ?? null } satisfies Stage0Feedback),
    },
  });

  const existing = await prisma.lessonProgress.findUnique({ where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } } });
  const firstTime = !existing;
  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
    create: { userId: user.id, lessonId: lesson.id, stage: 0, skill: "starter", bestScore: grade.pct, band: null },
    update: { bestScore: Math.max(existing?.bestScore ?? 0, grade.pct), attempts: { increment: 1 } },
  });

  let unlockedStage1 = false;
  if (isFinal && grade.gate?.unlocksStage1 && user.unlockedStage < 1) {
    await prisma.user.update({ where: { id: user.id }, data: { unlockedStage: 1 } });
    unlockedStage1 = true;
  }

  const xp = Math.round(10 + 20 * grade.pct);
  const activity = await recordActivity(user.id, firstTime ? xp : Math.round(xp / 4), lesson.minutes);

  const i = stage0Lessons.findIndex((l) => l.id === lesson.id);
  const next = stage0Lessons[i + 1];
  const nextHref = unlockedStage1 || (isFinal && grade.gate?.unlocksStage1) ? "/dashboard" : next ? `/starter/${next.id}` : "/starter";

  revalidatePath("/starter");
  revalidatePath("/dashboard");
  const { results: _r, ...summary } = grade;
  return { ok: true, grade: summary, activity, firstTime, unlockedStage1, nextHref };
}
