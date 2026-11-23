import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { Stage0Player } from "@/components/stage0/Stage0Player";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { flags } from "@/lib/flags";
import { getT } from "@/lib/i18n/server";
import { pairsFromAttempts, planReview, reviewsLeftToday } from "@/lib/stage0/review";
import { lessonView } from "@/lib/stage0/view";

export const metadata: Metadata = { title: "Stage 0 · Review" };

/** Today's Stage 0 review: what the spaced-review engine says is due, asked again. */
export default async function Stage0ReviewPage() {
  if (!flags.stage0()) notFound();
  const user = await requireUser();
  const { t, formatDate } = await getT();
  const [progress, attempts] = await Promise.all([
    prisma.lessonProgress.findMany({ where: { userId: user.id, stage: 0 }, select: { lessonId: true } }),
    prisma.attempt.findMany({ where: { userId: user.id, kind: "stage0" }, select: { createdAt: true, feedbackJson: true, refId: true, responseJson: true } }),
  ]);
  const plan = planReview(pairsFromAttempts(attempts), new Set(progress.map((p) => p.lessonId)), new Date(), reviewsLeftToday(attempts, new Date()));

  if (plan.lesson.steps.length === 0) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <Icon name="check" size={36} style={{ margin: "0 auto", color: "var(--success)" }} />
        <p className="mt-4 font-bold" dir="auto">
          {t("starter.reviewNothing")}
        </p>
        {plan.nextDue && (
          <p className="mt-2 text-sm" dir="auto" style={{ color: "var(--muted)" }}>
            {t("starter.reviewNext", { date: formatDate(plan.nextDue) })}
          </p>
        )}
        <Link href="/starter" className="btn btn-primary mt-6">
          {t("starter.back")}
        </Link>
      </div>
    );
  }

  return <Stage0Player review lessonId={plan.lesson.id} titleAr={plan.lesson.titleAr} views={lessonView(plan.lesson, plan.taught)} />;
}
