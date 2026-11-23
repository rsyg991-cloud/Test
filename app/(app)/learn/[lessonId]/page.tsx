import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLesson } from "@/content";
import { Icon } from "@/components/icons";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { stage1Supports, supportedMinWords } from "@/lib/stage0/supports";

export async function generateMetadata({ params }: { params: Promise<{ lessonId: string }> }): Promise<Metadata> {
  const { lessonId } = await params;
  return { title: getLesson(lessonId)?.title ?? "Lesson" };
}

export default async function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const lesson = getLesson(lessonId);
  if (!lesson) notFound();
  const user = await requireUser();
  const { t, stage } = await getT();

  if (lesson.stage > user.unlockedStage) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <Icon name="lock" size={36} style={{ margin: "0 auto", color: "var(--muted)" }} />
        <h1 className="mt-4 font-display text-2xl">{t("lesson.lockedTitle")}</h1>
        <p className="mt-2" style={{ color: "var(--muted)" }}>
          {t("lesson.lockedBody", { n: lesson.stage - 1 })}
        </p>
        <Link href="/journey" className="btn btn-primary mt-6">
          {t("lesson.backToJourney")}
        </Link>
      </div>
    );
  }

  const progress = await prisma.lessonProgress.findUnique({ where: { userId_lessonId: { userId: user.id, lessonId } } });
  // Learners who came through Stage 0 with a weak skill get Stage 1 supports (lower writing minimum, listen to the passage).
  const supports = lesson.stage === 1 ? await stage1Supports(user) : [];
  const shown = lesson.writing
    ? { ...lesson, writing: { ...lesson.writing, minWords: supportedMinWords(lesson.writing.minWords, supports, lesson.id) } }
    : lesson;
  return <LessonPlayer lesson={shown} stageName={stage(lesson.stage, "name")} previousBest={progress?.bestScore ?? null} supports={supports} />;
}
