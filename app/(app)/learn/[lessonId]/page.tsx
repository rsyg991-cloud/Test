import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLesson, getStage } from "@/content";
import { Icon } from "@/components/icons";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function generateMetadata({ params }: { params: Promise<{ lessonId: string }> }): Promise<Metadata> {
  const { lessonId } = await params;
  return { title: getLesson(lessonId)?.title ?? "Lesson" };
}

export default async function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const lesson = getLesson(lessonId);
  if (!lesson) notFound();
  const user = await requireUser();

  if (lesson.stage > user.unlockedStage) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <Icon name="lock" size={36} style={{ margin: "0 auto", color: "var(--muted)" }} />
        <h1 className="mt-4 font-display text-2xl font-bold">This stage is still locked</h1>
        <p className="mt-2" style={{ color: "var(--muted)" }}>
          Pass the Stage {lesson.stage - 1} checkpoint to unlock it.
        </p>
        <Link href="/journey" className="btn btn-primary mt-6">
          Back to the journey
        </Link>
      </div>
    );
  }

  const progress = await prisma.lessonProgress.findUnique({ where: { userId_lessonId: { userId: user.id, lessonId } } });
  return <LessonPlayer lesson={lesson} stageName={getStage(lesson.stage)!.name} previousBest={progress?.bestScore ?? null} />;
}
