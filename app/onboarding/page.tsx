import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { PlacementResult } from "@/app/actions/onboarding";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stageForBand } from "@/content/stageList";
import { overallBand } from "@/lib/scoring";
import { OnboardingFlow } from "./OnboardingFlow";

export const metadata: Metadata = { title: "Get started" };

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

  return <OnboardingFlow name={user.name} initialResult={initial} />;
}
