import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FINAL_STAGE, getStage, passBandFor } from "@/content";
import { Icon } from "@/components/icons";
import { requireUser } from "@/lib/auth";
import { CheckpointFlow } from "./CheckpointFlow";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("meta.checkpoint") };
}

export default async function CheckpointPage({ params }: { params: Promise<{ stage: string }> }) {
  const { stage: raw } = await params;
  const stage = getStage(Number(raw));
  if (!stage) notFound();
  const user = await requireUser();
  const { t, stage: stageText } = await getT();
  if (stage.id > user.unlockedStage) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <Icon name="lock" size={36} style={{ margin: "0 auto", color: "var(--muted)" }} />
        <h1 className="mt-4 font-display text-2xl">{t("checkpoint.locked")}</h1>
        <Link href="/journey" className="btn btn-primary mt-6">
          {t("lesson.backToJourney")}
        </Link>
      </div>
    );
  }
  return <CheckpointFlow checkpoint={stage.checkpoint} stageName={stageText(stage.id, "name")} passBand={passBandFor(stage.id)} isFinal={stage.id === FINAL_STAGE} />;
}
