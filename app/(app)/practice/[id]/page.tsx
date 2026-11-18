import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getPractice } from "@/content";
import { requireUser } from "@/lib/auth";
import { PracticeRunner } from "./PracticeRunner";

export const metadata: Metadata = { title: "Practice drill" };

export default async function PracticeDrill({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prompt = getPractice(id);
  if (!prompt) notFound();
  const user = await requireUser();
  if (prompt.stage > user.unlockedStage) redirect("/practice");
  return <PracticeRunner prompt={prompt} />;
}
