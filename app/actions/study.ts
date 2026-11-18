"use server";

import { revalidatePath } from "next/cache";
import { curriculumFrom } from "@/content";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addDays, startOfUTCDay } from "@/lib/dates";
import { catchUpStart, scheduleItems } from "@/lib/plan/scheduler";
import { getCompletedIds, recordActivity } from "@/lib/progress";
import { review } from "@/lib/srs";

export async function reviewVocab(cardId: string, grade: 0 | 3 | 4 | 5) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const };
  const card = await prisma.vocabCard.findUnique({ where: { id: cardId } });
  if (!card || card.userId !== user.id) return { ok: false as const };
  const next = review(card, grade);
  await prisma.vocabCard.update({
    where: { id: cardId },
    data: { ...next, due: addDays(startOfUTCDay(new Date()), next.interval) },
  });
  return { ok: true as const, interval: next.interval };
}

export async function finishVocabSession(reviewed: number) {
  const user = await getCurrentUser();
  if (!user || reviewed <= 0) return null;
  const activity = await recordActivity(user.id, Math.min(60, reviewed * 3), Math.max(1, Math.ceil(reviewed / 3)));
  revalidatePath("/dashboard");
  return activity;
}

async function firstIncompleteIndex(userId: string, startStage: number) {
  const items = curriculumFrom(startStage);
  const { ids } = await getCompletedIds(userId);
  const idx = items.findIndex((i) => !ids.has(i.id));
  return { items, idx: idx === -1 ? items.length - 1 : idx };
}

/** Shift the plan so the next unfinished item is scheduled for today. */
export async function catchUp() {
  const user = await getCurrentUser();
  if (!user?.planMonths || !user.planStart) return;
  const { items, idx } = await firstIncompleteIndex(user.id, user.startStage);
  const planStart = catchUpStart({
    months: user.planMonths,
    planStart: user.planStart,
    today: new Date(),
    itemCount: items.length,
    firstIncomplete: idx,
  });
  await prisma.user.update({ where: { id: user.id }, data: { planStart } });
  revalidatePath("/dashboard");
  revalidatePath("/plan");
}

/** Switch to a different plan length, keeping all progress. */
export async function changePlan(months: number, targetBand?: number, examDate?: string | null) {
  const user = await getCurrentUser();
  if (!user) return;
  const m = [1, 2, 3, 4, 6].includes(months) ? months : 3;
  const { items, idx } = await firstIncompleteIndex(user.id, user.startStage);
  const schedule = scheduleItems(m, items.length);
  const planStart = addDays(startOfUTCDay(new Date()), -(schedule[idx] ?? 0));
  const exam = examDate ? new Date(examDate) : examDate === null ? null : user.examDate;
  await prisma.user.update({
    where: { id: user.id },
    data: {
      planMonths: m,
      planStart,
      ...(targetBand ? { targetBand } : {}),
      examDate: exam && !Number.isNaN(exam.getTime()) ? exam : null,
    },
  });
  revalidatePath("/dashboard");
  revalidatePath("/plan");
}
