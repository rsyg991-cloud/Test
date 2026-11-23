"use server";

import { revalidatePath } from "next/cache";
import { curriculumFrom, FINAL_STAGE, parseGoals, tracksForGoals, getConversation, getLesson, getPractice, getStage, passBandFor, type Skill } from "@/content";
import { getCurrentUser } from "@/lib/auth";
import { loadOwnedAttempt } from "@/lib/attempts";
import { prisma } from "@/lib/db";
import { addBandSnapshot, addVocab, learnerPath, recordActivity, type ActivityResult } from "@/lib/progress";
import { bandFromScore, gradeQuestions, overallBand, roundBand, type Answers, type QuestionResult } from "@/lib/scoring";
import { academicReadingBand, listeningBand, writingBand } from "@/lib/mock/bands";
import { gradeGroups, type MockAnswers, type MockResult, type SectionGrade } from "@/lib/mock/grade";
import { gradeTask, type TaskGrade } from "@/lib/taskGrade";
import { getTest } from "@/lib/mock/registry";
import { getT } from "@/lib/i18n/server";
import { stage1Supports } from "@/lib/stage0/supports";

export interface CompletionResult {
  ok: true;
  band: number | null;
  pct?: number;
  correct?: number;
  total?: number;
  results?: QuestionResult[];
  /** Results for official IELTS question groups (Stages 6–7). */
  groupResults?: MockResult[];
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

async function nextStep(userId: string, user: { startStage: number; targetBand: number | null; unlockedStage: number; goals?: string | null }) {
  const unlockedStage = user.unlockedStage;
  // The learner's own path first; once it is finished, carry on into the stages beyond it.
  const items = [...learnerPath(user), ...curriculumFrom(user.startStage, FINAL_STAGE, tracksForGoals(parseGoals(user.goals)))];
  const [lessons, cps] = await Promise.all([
    prisma.lessonProgress.findMany({ where: { userId }, select: { lessonId: true } }),
    prisma.attempt.findMany({ where: { userId, kind: "checkpoint", skill: "overall", score: 1 }, select: { refId: true } }),
  ]);
  const done = new Set([...lessons.map((l) => l.lessonId), ...cps.map((c) => c.refId)]);
  const next = items.find((i) => !done.has(i.id) && i.stage <= unlockedStage);
  const { t, stage } = await getT();
  if (!next) return { nextHref: "/dashboard", nextTitle: t("next.backToDashboard") };
  if (next.kind === "lesson") return { nextHref: `/learn/${next.id}`, nextTitle: next.lesson.title };
  return { nextHref: `/checkpoint/${next.stage}`, nextTitle: t("next.checkpoint", { camp: stage(next.stage, "camp") }) };
}

export async function completeLesson(
  lessonId: string,
  payload: { answers?: Answers; attemptId?: string },
): Promise<CompletionResult | CompletionError> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: (await getT()).t("errors.loginAgain") };
  const lesson = getLesson(lessonId);
  if (!lesson) return { ok: false, error: (await getT()).t("errors.lessonNotFound") };
  if (lesson.stage > user.unlockedStage) return { ok: false, error: (await getT()).t("errors.stageLocked") };

  let band: number;
  let pct: number | undefined;
  let graded: TaskGrade | undefined;
  let attemptId: string | undefined;

  if (lesson.reading || lesson.listening) {
    graded = gradeTask((lesson.reading ?? lesson.listening)!, payload.answers ?? {});
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
        feedbackJson: JSON.stringify(graded.results ?? graded.groupResults),
      },
    });
    attemptId = a.id;
  } else {
    const a = await loadOwnedAttempt(user.id, payload.attemptId, {
      refId: lesson.id,
      skill: lesson.skill as "writing" | "speaking",
    });
    if (!a) return { ok: false, error: (await getT()).t("errors.submitFirst") };
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
    groupResults: graded?.groupResults,
    activity,
    vocabAdded,
    firstTime,
    ...(await nextStep(user.id, user)),
  };
}

export interface CheckpointResult {
  ok: true;
  bands: Record<Skill, number>;
  overall: number;
  passBand: number;
  passed: boolean;
  unlockedStage: number | null;
  /** Passed with Stage 1 writing supports: write again with at least this many words to open Stage 2. */
  fullWritingNeeded: number | null;
  reading: TaskGrade;
  listening: TaskGrade;
  activity: ActivityResult;
}

export async function completeCheckpoint(
  stageId: number,
  payload: { reading: Answers; listening: Answers; writingAttemptId?: string; speakingAttemptId?: string },
): Promise<CheckpointResult | CompletionError> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: (await getT()).t("errors.loginAgain") };
  const stage = getStage(stageId);
  if (!stage) return { ok: false, error: (await getT()).t("errors.stageNotFound") };
  if (stage.id > user.unlockedStage) return { ok: false, error: (await getT()).t("errors.checkpointLocked") };
  const cp = stage.checkpoint;

  const wa = await loadOwnedAttempt(user.id, payload.writingAttemptId, { refId: cp.id, skill: "writing" });
  const sa = await loadOwnedAttempt(user.id, payload.speakingAttemptId, { refId: cp.id, skill: "speaking" });
  if (!wa || !sa) return { ok: false, error: (await getT()).t("errors.completeWritingSpeaking") };

  const reading = gradeTask(cp.reading, payload.reading ?? {});
  const listening = gradeTask(cp.listening, payload.listening ?? {});
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
      feedbackJson: JSON.stringify({ bands, reading: reading.results ?? reading.groupResults, listening: listening.results ?? listening.groupResults }),
    },
  });

  // A learner who passed Stage 1 with the lower (supported) writing minimum opens Stage 2 only after
  // writing the checkpoint answer at the full minimum, so a weakness can't be carried forward for ever.
  let fullWritingNeeded: number | null = null;
  if (passed && stage.id === 1 && (await stage1Supports(user)).includes("writing")) {
    const text = (JSON.parse(wa.responseJson) as { text?: string }).text ?? "";
    if (text.trim().split(/\s+/).filter(Boolean).length < cp.writing.minWords) fullWritingNeeded = cp.writing.minWords;
  }

  let unlockedStage: number | null = null;
  if (passed && !fullWritingNeeded && stage.id === user.unlockedStage && stage.id < FINAL_STAGE) {
    unlockedStage = stage.id + 1;
    await prisma.user.update({ where: { id: user.id }, data: { unlockedStage } });
  }
  const activity = await recordActivity(user.id, passed ? 250 : 100, 60);
  revalidatePath("/dashboard");
  return { ok: true, bands, overall, passBand, passed, unlockedStage, fullWritingNeeded, reading, listening, activity };
}

export async function completePractice(promptId: string, attemptId: string): Promise<CompletionResult | CompletionError> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: (await getT()).t("errors.loginAgain") };
  const p = getPractice(promptId);
  if (!p) return { ok: false, error: (await getT()).t("errors.practiceNotFound") };
  const a = await loadOwnedAttempt(user.id, attemptId, { refId: p.id, skill: p.skill });
  if (!a) return { ok: false, error: (await getT()).t("errors.submitFirst") };
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
    nextTitle: (await getT()).t("next.morePractice"),
  };
}

export async function completeConversation(
  conversationId: string,
  payload: { attemptId?: string; checked: number },
): Promise<CompletionResult | CompletionError> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: (await getT()).t("errors.loginAgain") };
  const c = getConversation(conversationId);
  if (!c) return { ok: false, error: (await getT()).t("errors.conversationNotFound") };
  if (c.stage > user.unlockedStage) return { ok: false, error: (await getT()).t("errors.stageLocked") };

  const attempt = payload.attemptId
    ? await loadOwnedAttempt(user.id, payload.attemptId, { refId: c.id, skill: "conversation" })
    : null;
  if (payload.attemptId && !attempt) return { ok: false, error: (await getT()).t("errors.feedbackMissing") };

  const checked = Math.max(0, Math.min(c.selfCheck.length, Math.round(payload.checked)));
  const selfScore = checked / c.selfCheck.length;
  const previous = await prisma.attempt.count({ where: { userId: user.id, kind: "conversation-complete", refId: c.id } });
  const firstTime = previous === 0;

  // Record completion (used for "done" badges and today's suggestion).
  await prisma.attempt.create({
    data: {
      userId: user.id,
      kind: "conversation-complete",
      refId: c.id,
      skill: "speaking",
      score: selfScore,
      band: attempt?.band ?? null,
      responseJson: JSON.stringify({ checked, attemptId: attempt?.id ?? null }),
    },
  });

  if (attempt?.band != null) await addBandSnapshot(user.id, "speaking", attempt.band, "conversation");
  const vocabAdded = await addVocab(user.id, c.vocab);
  // Full XP with AI feedback on the transcript; 70% for a self-checked practice.
  const baseXp = Math.round(c.xp * (attempt ? 1 : 0.7));
  const activity = await recordActivity(user.id, firstTime ? baseXp : Math.round(baseXp / 3), c.minutes);

  revalidatePath("/dashboard");
  revalidatePath("/practice");
  return {
    ok: true,
    band: attempt?.band ?? null,
    pct: selfScore,
    activity,
    vocabAdded,
    firstTime,
    nextHref: "/practice#conversations",
    nextTitle: (await getT()).t("next.moreConversations"),
  };
}

export interface MockCompletion {
  ok: true;
  testId: string;
  listening: SectionGrade & { band: number };
  reading: SectionGrade & { band: number };
  writing: { task1: number | null; task2: number | null; band: number | null };
  speaking: { parts: (number | null)[]; band: number | null };
  overall: number | null;
  activity: ActivityResult;
}

export async function completeMock(
  testId: string,
  payload: {
    listening: MockAnswers;
    reading: MockAnswers;
    writing: { task1?: string; task2?: string };
    speaking: { p1?: string; p2?: string; p3?: string };
  },
): Promise<MockCompletion | CompletionError> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: (await getT()).t("errors.loginAgain") };
  const test = getTest(testId);
  if (!test) return { ok: false, error: (await getT()).t("errors.testNotFound") };

  const lg = gradeGroups(test.listening.flatMap((p) => p.groups), payload.listening ?? {});
  const rg = gradeGroups(test.reading.flatMap((p) => p.groups), payload.reading ?? {});
  const listening = { ...lg, band: listeningBand(lg.raw) };
  const reading = { ...rg, band: academicReadingBand(rg.raw) };

  const band = async (attemptId: string | undefined, ref: string, skill: "writing" | "speaking") =>
    (await loadOwnedAttempt(user.id, attemptId, { refId: `${testId}:${ref}`, skill }))?.band ?? null;
  const t1 = await band(payload.writing?.task1, "task1", "writing");
  const t2 = await band(payload.writing?.task2, "task2", "writing");
  const sp = [
    await band(payload.speaking?.p1, "speaking-1", "speaking"),
    await band(payload.speaking?.p2, "speaking-2", "speaking"),
    await band(payload.speaking?.p3, "speaking-3", "speaking"),
  ];
  const spDone = sp.filter((b): b is number => b !== null);
  const writing = { task1: t1, task2: t2, band: writingBand(t1, t2) };
  const speaking = { parts: sp, band: spDone.length ? roundBand(spDone.reduce((a, b) => a + b, 0) / spDone.length) : null };
  const overall = overallBand({ listening: listening.band, reading: reading.band, writing: writing.band, speaking: speaking.band });

  await addBandSnapshot(user.id, "listening", listening.band, "mock");
  await addBandSnapshot(user.id, "reading", reading.band, "mock");
  if (writing.band !== null) await addBandSnapshot(user.id, "writing", writing.band, "mock");
  if (speaking.band !== null) await addBandSnapshot(user.id, "speaking", speaking.band, "mock");

  await prisma.attempt.create({
    data: {
      userId: user.id,
      kind: "mock",
      refId: testId,
      skill: "overall",
      score: (lg.raw + rg.raw) / 80,
      band: overall,
      responseJson: JSON.stringify(payload),
      feedbackJson: JSON.stringify({ listening: { raw: lg.raw, band: listening.band }, reading: { raw: rg.raw, band: reading.band }, writing, speaking }),
    },
  });
  const activity = await recordActivity(user.id, 300, 165);
  revalidatePath("/dashboard");
  revalidatePath("/progress");
  return { ok: true, testId, listening, reading, writing, speaking, overall, activity };
}
