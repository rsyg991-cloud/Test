import "server-only";
import { checkpointAliases, curriculumFrom, stageCheckpointIds, endStageFor, FINAL_STAGE, parseGoals, SKILLS, stages, tracksForGoals, wantsIelts, type Skill, type VocabItem } from "@/content";
import { prisma } from "@/lib/db";
import { addDays, dayKey } from "@/lib/dates";
import { computeToday } from "@/lib/plan/scheduler";
import { estimateSkillBand, overallBand } from "@/lib/scoring";
import type { CurrentUser } from "@/lib/auth";

export interface ActivityResult {
  xpGained: number;
  totalXp: number;
  streak: number;
  streakExtended: boolean;
  freezeUsed: boolean;
  freezeEarned: boolean;
}

/** Record XP + minutes for today and update the streak. */
export async function recordActivity(userId: string, xp: number, minutes: number): Promise<ActivityResult> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const today = dayKey();
  const yesterday = dayKey(addDays(new Date(), -1));
  const twoDaysAgo = dayKey(addDays(new Date(), -2));

  let streak = user.streak;
  let freezes = user.streakFreezes;
  let streakExtended = false;
  let freezeUsed = false;
  let freezeEarned = false;

  if (user.lastActiveDay !== today) {
    if (user.lastActiveDay === yesterday) streak += 1;
    else if (user.lastActiveDay === twoDaysAgo && freezes > 0) {
      streak += 1;
      freezes -= 1;
      freezeUsed = true;
    } else streak = 1;
    streakExtended = true;
    if (streak > 0 && streak % 7 === 0 && freezes < 2) {
      freezes += 1;
      freezeEarned = true;
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      xp: { increment: xp },
      streak,
      longestStreak: Math.max(user.longestStreak, streak),
      lastActiveDay: today,
      streakFreezes: freezes,
    },
  });
  await prisma.activityDay.upsert({
    where: { userId_day: { userId, day: today } },
    create: { userId, day: today, xp, minutes, tasks: 1 },
    update: { xp: { increment: xp }, minutes: { increment: minutes }, tasks: { increment: 1 } },
  });

  return { xpGained: xp, totalXp: updated.xp, streak, streakExtended, freezeUsed, freezeEarned };
}

export async function addBandSnapshot(userId: string, skill: Skill, band: number, source: string) {
  await prisma.bandSnapshot.create({ data: { userId, skill, band, source } });
}

export async function addVocab(userId: string, items: VocabItem[]) {
  const existing = await prisma.vocabCard.findMany({
    where: { userId, word: { in: items.map((i) => i.word) } },
    select: { word: true },
  });
  const have = new Set(existing.map((e) => e.word));
  const fresh = items.filter((i) => !have.has(i.word));
  for (const it of fresh) {
    await prisma.vocabCard.create({
      data: { userId, word: it.word, definition: it.definition, example: it.example },
    });
  }
  return fresh.length;
}

export async function getSkillBands(userId: string) {
  const snaps = await prisma.bandSnapshot.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  const bands = Object.fromEntries(
    SKILLS.map((s) => [s, estimateSkillBand(snaps.filter((x) => x.skill === s))]),
  ) as Record<Skill, number | null>;
  return { bands, overall: overallBand(bands), snapshots: snaps };
}

export async function getCompletedIds(userId: string) {
  const [lessons, checkpoints] = await Promise.all([
    prisma.lessonProgress.findMany({ where: { userId }, select: { lessonId: true, bestScore: true, band: true } }),
    prisma.attempt.findMany({ where: { userId, kind: "checkpoint", skill: "overall", score: 1 }, select: { refId: true, band: true } }),
  ]);
  const ids = new Set<string>(lessons.map((l) => l.lessonId));
  checkpoints.forEach((c) => checkpointAliases(c.refId).forEach((id) => ids.add(id)));
  return { ids, lessons };
}

/** The learner's own path: from their start stage to the stage their goals reach. */
export function learnerPath(user: { startStage: number; targetBand: number | null; goals?: string | null }) {
  const goals = parseGoals(user.goals);
  // An IELTS target ends where the band is reached; other goals run through every stage.
  const end = wantsIelts(goals) ? endStageFor(user.targetBand) : FINAL_STAGE;
  return curriculumFrom(user.startStage, end, tracksForGoals(goals));
}

export async function getTodayPlan(user: CurrentUser) {
  const items = learnerPath(user);
  const { ids } = await getCompletedIds(user.id);
  const completed = items.map((i) => ids.has(i.id));
  const today = computeToday({
    months: user.planMonths ?? 3,
    planStart: user.planStart ?? new Date(),
    today: new Date(),
    itemCount: items.length,
    completed,
  });
  return { items, completed, today, completedIds: ids };
}

export function stageProgress(
  completedIds: Set<string>,
  unlockedStage: number,
  path?: { startStage: number; targetBand: number | null; goals?: string | null },
) {
  const start = path?.startStage ?? 1;
  const end = !path ? stages[stages.length - 1].id : wantsIelts(parseGoals(path.goals)) ? endStageFor(path.targetBand) : FINAL_STAGE;
  return stages.map((s) => {
    const lessons = s.units.flatMap((u) => u.lessons);
    const done = lessons.filter((l) => completedIds.has(l.id)).length;
    return {
      id: s.id,
      name: s.name,
      camp: s.camp,
      cefr: s.cefr,
      pct: done / lessons.length,
      done,
      total: lessons.length,
      passed: stageCheckpointIds(s).some((id) => completedIds.has(id)),
      locked: s.id > unlockedStage,
      /** Below the learner's start stage (placed higher). */
      skipped: s.id < start && !stageCheckpointIds(s).some((id) => completedIds.has(id)),
      /** Inside the learner's path to their target band. */
      inPlan: s.id >= start && s.id <= Math.max(start, end),
    };
  });
}

export async function aiUsageToday(userId: string) {
  const since = new Date(`${dayKey()}T00:00:00.000Z`);
  return prisma.attempt.count({ where: { userId, aiGraded: true, createdAt: { gte: since } } });
}
