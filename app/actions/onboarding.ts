"use server";

import { redirect } from "next/navigation";
import { placement } from "@/content/placement";
import { FINAL_STAGE, stageForBand } from "@/content/stageList";
import { PLAN_MONTHS } from "@/lib/plan/scheduler";
import { getT } from "@/lib/i18n/server";
import { getCurrentUser } from "@/lib/auth";
import { loadOwnedAttempt } from "@/lib/attempts";
import { prisma } from "@/lib/db";
import { addBandSnapshot } from "@/lib/progress";
import { bandFromScore, gradeQuestions, overallBand, roundBand, type Answers } from "@/lib/scoring";
import { startOfUTCDay } from "@/lib/dates";
import { flags } from "@/lib/flags";

export interface PlacementResult {
  bands: { reading: number; listening: number; writing: number; speaking: number };
  overall: number;
  recommendedStage: number;
  grammarPct: number;
  aiUsed: { writing: boolean; speaking: boolean };
}

export async function submitPlacement(input: {
  grammar: Answers;
  reading: Answers;
  listening: Answers;
  writingAttemptId?: string;
  speakingAttemptId?: string;
}): Promise<PlacementResult> {
  const user = await getCurrentUser();
  if (!user) throw new Error((await getT()).t("errors.loginAgain"));

  const g = gradeQuestions(placement.grammar, input.grammar ?? {});
  const r = gradeQuestions(placement.reading.questions, input.reading ?? {});
  const l = gradeQuestions(placement.listening.questions, input.listening ?? {});

  const languageBand = bandFromScore(g.pct, 0);
  const reading = bandFromScore(r.pct * 0.7 + g.pct * 0.3, 0);
  const listening = bandFromScore(l.pct * 0.8 + g.pct * 0.2, 0);

  const wa = await loadOwnedAttempt(user.id, input.writingAttemptId, { refId: "placement", skill: "writing" });
  const sa = await loadOwnedAttempt(user.id, input.speakingAttemptId, { refId: "placement", skill: "speaking" });
  const writing = wa?.band ?? roundBand(languageBand - 0.5);
  const speaking = sa?.band ?? roundBand(languageBand - 0.5);

  const bands = { reading, listening, writing, speaking };
  const overall = overallBand(bands) ?? 5;
  const recommendedStage = stageForBand(overall);

  // Retaking the placement replaces the previous placement snapshots.
  await prisma.bandSnapshot.deleteMany({ where: { userId: user.id, source: "placement" } });
  for (const [skill, band] of Object.entries(bands)) {
    await addBandSnapshot(user.id, skill as keyof typeof bands, band, "placement");
  }
  await prisma.attempt.create({
    data: {
      userId: user.id,
      kind: "placement",
      refId: "placement",
      skill: "overall",
      score: (g.pct + r.pct + l.pct) / 3,
      band: overall,
      responseJson: JSON.stringify({ grammar: input.grammar, reading: input.reading, listening: input.listening }),
    },
  });
  await prisma.user.update({ where: { id: user.id }, data: { placementDone: true } });

  return { bands, overall, recommendedStage, grammarPct: g.pct, aiUsed: { writing: !!wa, speaking: !!sa } };
}

export async function savePlan(input: {
  targetBand: number;
  examDate: string | null;
  months: number;
  startStage: number;
  /** The learner said they know no English: start at Stage 0 when it is switched on. */
  fromZero?: boolean;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const months = PLAN_MONTHS.includes(input.months) ? input.months : 3;
  let startStage = Math.min(FINAL_STAGE, Math.max(1, Math.round(input.startStage)));
  let unlockedStage = Math.max(user.unlockedStage, startStage);
  // Stage 0 only for a learner with no progress yet, so nobody's open stages are ever taken away.
  if (input.fromZero && flags.stage0() && (await prisma.lessonProgress.count({ where: { userId: user.id } })) === 0 && user.unlockedStage <= 1) {
    startStage = 0;
    unlockedStage = 0;
  }
  const targetBand = roundBand(Math.min(9, Math.max(4, input.targetBand)));
  const examDate = input.examDate ? new Date(input.examDate) : null;
  await prisma.user.update({
    where: { id: user.id },
    data: {
      planMonths: months,
      planStart: startOfUTCDay(new Date()),
      targetBand,
      examDate: examDate && !Number.isNaN(examDate.getTime()) ? examDate : null,
      startStage,
      unlockedStage,
      placementDone: true,
    },
  });
  redirect(startStage === 0 ? "/starter" : "/dashboard?welcome=1");
}
