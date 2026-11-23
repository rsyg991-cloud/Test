import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { redirect } from "next/navigation";
import type { PlacementResult } from "@/app/actions/onboarding";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stageForBand } from "@/content/stageList";
import { curriculumFrom, FINAL_STAGE, tracksForGoals, type Goal } from "@/content";
import { overallBand } from "@/lib/scoring";
import { OnboardingFlow } from "./OnboardingFlow";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("meta.onboarding") };
}

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.placementDone && user.planMonths) redirect("/dashboard");

  let initial: PlacementResult | null = null;
  if (user.placementDone) {
    const snaps = await prisma.bandSnapshot.findMany({ where: { userId: user.id, source: "placement" } });
    const get = (s: string) => snaps.find((x) => x.skill === s)?.band ?? 5;
    const bands = { reading: get("reading"), listening: get("listening"), writing: get("writing"), speaking: get("speaking") };
    const overall = overallBand(bands) ?? 5;
    initial = {
      bands,
      overall,
      recommendedStage: stageForBand(overall),
      grammarPct: 0,
      aiUsed: { writing: true, speaking: true },
    };
  }

  // Exact path sizes for every goal combination, so the plan picker can pace any choice.
  const pathCounts: Record<string, number> = {};
  for (const ielts of [false, true])
    for (const academic of [false, true])
      for (const work of [false, true]) {
        const goals: Goal[] = ["general", ...(ielts ? ["ielts" as const] : []), ...(academic ? ["academic" as const] : []), ...(work ? ["work" as const] : [])];
        const tracks = tracksForGoals(goals)!;
        for (let start = 1; start <= FINAL_STAGE; start++)
          for (let end = start; end <= FINAL_STAGE; end++) pathCounts[`${goals.join("+")}|${start}|${end}`] = curriculumFrom(start, end, tracks).length;
      }

  return <OnboardingFlow name={user.name} initialResult={initial} pathCounts={pathCounts} />;
}
