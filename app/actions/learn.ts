"use server";

import { revalidatePath } from "next/cache";
import { curriculumFrom, getLesson, getPractice, getStage, passBandFor, type Skill } from "@/content";
import { getCurrentUser } from "@/lib/auth";
import { loadOwnedAttempt } from "@/lib/attempts";
import { prisma } from "@/lib/db";
import { addBandSnapshot, addVocab, recordActivity, type ActivityResult } from "@/lib/progress";
import { bandFromScore, gradeQuestions, overallBand, type Answers, type QuestionResult } from "@/lib/scoring";

export interface CompletionResult {
  ok: true;
  band: number;
  pct?: number;
  correct?: number;
  total?: number;
  results?: QuestionResult[];
  activity: ActivityResult;
  vocabAdded: number;
  firstTime: boolean;
  nextHref: string;
  nextTitle: string;
}

export interface CompletionError {
  ok: false;
  error: string;
}

async function nextStep(userId: string, startStage: number, unlockedStage: number) {
  const items = curriculumFrom(startStage);
  const [lessons, cps] = await Promise.all([
    prisma.lessonProgress.findMany({ where: { userId }, select: { lessonId: true } }),
    prisma.attempt.findMany({ where: { userId, kind: "checkpoint", skill: "overall", score: 1 }, select: { refId: true } }),
  ]);
  const done = new Set([...lessons.map((l) => l.lessonId), ...cps.map((c) => c.refId)]);
  const next = items.find((i) => !done.has(i.id) && i.stage <= unlockedStage);
  if (!next) return { nextHref: "/dashboard", nextTitle: "Back to dashboard" };
  if (next.kind === "lesson") return { nextHref: `/learn/${next.id}`, nextTitle: next.lesson.title };
  return { nextHref: `/checkpoint/${next.stage}`, nextTitle: next.checkpoint.title };
}

export async function completeLesson(
  lessonId: string,
  payload: { answers?: Answers; attemptId?: string },
): Promise<CompletionResult | CompletionError> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in again." };
  const lesson = getLesson(lessonId);
  if (!lesson) return { ok: false, error: "Lesson not found." };
  if (lesson.stage > user.unlockedStage) return { ok: false, error: "This stage is still locked." };

  let band: number;
  let pct: number | undefined;
  let graded: ReturnType<typeof gradeQuestions> | undefined;
  let attemptId: string | undefined;

  if (lesson.reading || lesson.listening) {
    const questions = (lesson.reading ?? lesson.listening)!.questions;
    graded = gradeQuestions(questions, payload.answers ?? {});
    pct = graded.pct;
    band = bandFromScore(pct, lesson.stage);
    const a = await prisma.attempt.create({
      data: {
        userId: user.id,
        kind: "lesson",
        refId: lesson.id,
        skill: lesson.skill,
        score: pct,
        band,
        responseJson: JSON.stringify(payload.answers ?? {}),
        feedbackJson: JSON.stringify(graded.results),
      },
    });
    attemptId = a.id;
  } else {
    const a = await loadOwnedAttempt(user.id, payload.attemptId, {
      refId: lesson.id,
      skill: lesson.skill as "writing" | "speaking",
    });
    if (!a) return { ok: false, error: "Please submit your answer for feedback first." };
    band = a.band!;
    attemptId = a.id;
  }

  const existing = await prisma.lessonProgress.findUnique({ where: { userId_lessonId: { userId: user.id, lessonId } } });
  const firstTime = !existing;
  const score = pct ?? Math.min(1, band / 9);
  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    create: { userId: user.id, lessonId, stage: lesson.stage, skill: lesson.skill, bestScore: score, band },
    update: { bestScore: Math.max(existing?.bestScore ?? 0, score), band, attempts: { increment: 1 } },
  });

  await addBandSnapshot(user.id, lesson.skill, band, "lesson");
  const vocabAdded = await addVocab(user.id, lesson.vocab);
  const baseXp = pct !== undefined ? Math.round(lesson.xp * (0.5 + 0.5 * pct)) : lesson.xp;
  const activity = await recordActivity(user.id, firstTime ? baseXp : Math.round(baseXp / 4), lesson.minutes);

  revalidatePath("/dashboard");
  return {
    ok: true,
    band,
    pct,
    correct: graded?.correct,
    total: graded?.total,
    results: graded?.results,
    activity,
    vocabAdded,
    firstTime,
    ...(await nextStep(user.id, user.startStage, user.unlockedStage)),
  };
}

export interface CheckpointResult {
  ok: true;
  bands: Record<Skill, number>;
  overall: number;
  passBand: number;
  passed: boolean;
  unlockedStage: number | null;
  reading: ReturnType<typeof gradeQuestions>;
  listening: ReturnType<typeof gradeQuestions>;
  activity: ActivityResult;
}

export async function completeCheckpoint(
  stageId: number,
  payload: { reading: Answers; listening: Answers; writingAttemptId?: string; speakingAttemptId?: string },
): Promise<CheckpointResult | CompletionError> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in again." };
  const stage = getStage(stageId);
  if (!stage) return { ok: false, error: "Stage not found." };
  if (stage.id > user.unlockedStage) return { ok: false, error: "This checkpoint is still locked." };
  const cp = stage.checkpoint;

  const wa = await loadOwnedAttempt(user.id, payload.writingAttemptId, { refId: cp.id, skill: "writing" });
  const sa = await loadOwnedAttempt(user.id, payload.speakingAttemptId, { refId: cp.id, skill: "speaking" });
  if (!wa || !sa) return { ok: false, error: "Please complete the Writing and Speaking sections first." };

  const reading = gradeQuestions(cp.reading.questions, payload.reading ?? {});
  const listening = gradeQuestions(cp.listening.questions, payload.listening ?? {});
  const bands: Record<Skill, number> = {
    reading: bandFromScore(reading.pct, stage.id),
    listening: bandFromScore(listening.pct, stage.id),
    writing: wa.band!,
    speaking: sa.band!,
  };
  const overall = overallBand(bands)!;
  const passBand = passBandFor(stage.id);
  const passed = overall >= passBand;

  for (const [skill, band] of Object.entries(bands)) await addBandSnapshot(user.id, skill as Skill, band, "checkpoint");
  await prisma.attempt.create({
    data: {
      userId: user.id,
      kind: "checkpoint",
      refId: cp.id,
      skill: "overall",
      score: passed ? 1 : 0,
      band: overall,
      responseJson: JSON.stringify(payload),
      feedbackJson: JSON.stringify({ bands, reading: reading.results, listening: listening.results }),
    },
  });

  let unlockedStage: number | null = null;
  if (passed && stage.id === user.unlockedStage && stage.id < 4) {
    unlockedStage = stage.id + 1;
    await prisma.user.update({ where: { id: user.id }, data: { unlockedStage } });
  }
  const activity = await recordActivity(user.id, passed ? 250 : 100, 60);
  revalidatePath("/dashboard");
  return { ok: true, bands, overall, passBand, passed, unlockedStage, reading, listening, activity };
}

export async function completePractice(promptId: string, attemptId: string): Promise<CompletionResult | CompletionError> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please log in again." };
  const p = getPractice(promptId);
  if (!p) return { ok: false, error: "Practice task not found." };
  const a = await loadOwnedAttempt(user.id, attemptId, { refId: p.id, skill: p.skill });
  if (!a) return { ok: false, error: "Please submit your answer for feedback first." };
  await addBandSnapshot(user.id, p.skill, a.band!, "practice");
  const activity = await recordActivity(user.id, 40, p.skill === "writing" ? 40 : 15);
  revalidatePath("/dashboard");
  return {
    ok: true,
    band: a.band!,
    activity,
    vocabAdded: 0,
    firstTime: true,
    nextHref: "/practice",
    nextTitle: "More practice",
  };
}
