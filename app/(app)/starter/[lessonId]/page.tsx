import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { Stage0Player } from "@/components/stage0/Stage0Player";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { flags } from "@/lib/flags";
import { getT } from "@/lib/i18n/server";
import { getStage0Lesson, lessonView, previousStage0Lesson } from "@/lib/stage0/view";

export async function generateMetadata({ params }: { params: Promise<{ lessonId: string }> }): Promise<Metadata> {
  const { lessonId } = await params;
  return { title: getStage0Lesson(lessonId)?.title ?? "Stage 0" };
}

export default async function Stage0LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  if (!flags.stage0()) notFound();
  const { lessonId } = await params;
  const lesson = getStage0Lesson(lessonId);
  if (!lesson) notFound();
  const user = await requireUser();
  const { t } = await getT();

  const prev = previousStage0Lesson(lessonId);
  const open = !prev || (await prisma.lessonProgress.findUnique({ where: { userId_lessonId: { userId: user.id, lessonId: prev.id } } }));
  if (!open) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <Icon name="lock" size={36} style={{ margin: "0 auto", color: "var(--muted)" }} />
        <p className="ar mt-4" dir="rtl">{t("starter.locked")}</p>
        <Link href="/starter" className="btn btn-primary mt-6">
          {t("starter.back")}
        </Link>
      </div>
    );
  }

  return <Stage0Player lessonId={lesson.id} titleAr={lesson.titleAr} views={lessonView(lesson)} />;
}
